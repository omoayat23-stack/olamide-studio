# Firestore Security Specification: Olamide Visuals

This specification defines the security architecture, data integrity invariants, and negative test patterns to secure the Olamide Visuals Firestore backend.

## 1. Data Invariants
1. **Public Reads, Restricted Writes**: Curated portfolio items, services, blog posts, and website content are readable by any client, but can ONLY be modified, created, or deleted by authenticated super-administrators.
2. **Secure Client Operations**:
   - Booking requests (`/bookings/{id}`) can be created by any client if the data matches a standard schema, but once created, only super-administrators can update booking statuses, edit dates, or delete records.
   - Contact inquiries (`/messages/{id}`) can be created by any client, but only admins can view, reply, or delete them.
3. **Admin Exclusivity**: Crew lists, system logs, payment transactions, and profile data are restricted to authenticated admins for both read and write operations.
4. **Verified Session Mandatory**: Administrator writes require explicit session authentication checks.

---

## 2. The "Dirty Dozen" Payloads (Wreaking Havoc)

The following 12 payloads represent malicious attempts to bypass identity boundaries, hijack roles, poison data, or shortcut critical state. All of these payloads must be explicitly rejected (`PERMISSION_DENIED`) by the Firestore security rules.

### Payload 1: Admin Profile Hijacking (Privilege Escalation)
An unauthenticated user attempts to write/overwrite the administrator profile to assign themselves full permissions.
- **Path**: `/profile/admin_user`
- **Payload**: `{"username": "attacker", "fullName": "Attacker Hack", "email": "attacker@gmail.com", "phone": "08142870306", "avatarUrl": "", "twoFactorEnabled": false, "isAdmin": true}`

### Payload 2: Booking Status Shortcut (State Escalation)
A user attempts to create a pre-confirmed booking without admin approval.
- **Path**: `/bookings/test-booking`
- **Payload**: `{"id": "test-booking", "name": "Fake Booking", "email": "client@gmail.com", "phone": "08142870306", "eventType": "Portrait", "preferredDate": "2026-07-10", "message": "High-contrast portraits", "createdAt": "2026-06-25T12:00:00Z", "status": "confirmed"}`

### Payload 3: Transaction Spoofing (Financial Injection)
An attacker injects a "completed" transaction record to mimic a fake payment event.
- **Path**: `/transactions/fake-tx`
- **Payload**: `{"id": "fake-tx", "bookingId": "BK-5482", "clientName": "Osas Osaro", "amount": 1000000, "method": "Paystack", "status": "completed", "date": "2026-06-25T12:00:00Z", "invoiceNo": "INV-F-123"}`

### Payload 4: Arbitrary Portfolio Editing (Resource Defacement)
A non-admin client attempts to create or modify a portfolio entry to insert inappropriate external links or deface the page.
- **Path**: `/portfolio/item-1`
- **Payload**: `{"id": "item-1", "title": "Defaced Portrait", "category": "Portraits", "imageUrl": "https://malicious.site/hacked.jpg", "description": "Hacked!", "aspect": "portrait", "location": "Unknown", "year": "2026"}`

### Payload 5: System Audit Trail Erasure
An attacker attempts to write directly to `/logs/{logId}` to clear or alter the audit trails of their malicious activities.
- **Path**: `/logs/log-123`
- **Payload**: `{"id": "log-123", "timestamp": "2026-06-25T12:00:00Z", "action": "Deleted all data", "category": "system", "user": "Attacker", "ip": "1.1.1.1", "device": "Attack Rig"}`

### Payload 6: Website Biography Content Defacement
A malicious script attempts to update the studio’s displayed biographical information with spam.
- **Path**: `/content/home`
- **Payload**: `{"hero": {"title": "Spam Title", "subTitle": "Spam", "ctaText": "Buy Now"}, "about": {"biography": "Malicious spam description", "profileImage": "", "businessAddress": "Spam Land"}, "branding": {"logoText": "Spam", "tagline": "Spam", "primaryColor": "red", "fontFamily": "sans-serif", "faviconUrl": ""}, "settings": {"maintenanceMode": true, "whatsappNumber": "", "businessEmail": "", "businessPhone": "", "socials": {}, "seo": {}, "payments": {}}}`

### Payload 7: Client Message Snooping (PII Data Leak)
A regular unauthenticated guest attempts to execute a list/query or fetch details of incoming client messages.
- **Path**: `/messages/msg-1`
- **Operation**: `GET` / `LIST` (with no auth / standard auth)

### Payload 8: Crew Member Spoofing (Privilege Manipulation)
A user tries to register themselves as a crew member with full access privileges.
- **Path**: `/crew/crew-attacker`
- **Payload**: `{"id": "crew-attacker", "name": "Attacker", "role": "Hacker", "photoUrl": "...", "availability": "Available", "phone": "000000000", "email": "hacked@olamidevisuals.com", "permissions": "Full Access"}`

### Payload 9: Empty Booking Form Injection (Denial of Wallet)
An attacker attempts to send bookings with massive 1MB string junk elements to cause document storage bloat and financial bills.
- **Path**: `/bookings/bloat-booking`
- **Payload**: `{"id": "bloat-booking", "name": "A".repeat(50000), "email": "client@gmail.com", "phone": "08142870306", "eventType": "Portrait", "preferredDate": "2026-07-10", "message": "A".repeat(50000), "createdAt": "2026-06-25T12:00:00Z", "status": "pending"}`

### Payload 10: Client Message Status Manipulation
A user attempts to mark their own message as "replied" or inject arbitrary reply text from the client side without administrator interaction.
- **Path**: `/messages/msg-1`
- **Payload**: `{"id": "msg-1", "name": "Amina Bello", "email": "amina@gmail.com", "subject": "Inquiry", "message": "Hi", "date": "2026-06-25T12:00:00Z", "status": "replied", "replyText": "You are approved for free!"}`

### Payload 11: Media Library Injection (Ghost Files)
A client tries to register a bulk list of files in the admin’s internal Media Library folders to flood local storage listings.
- **Path**: `/media/fake-media`
- **Payload**: `{"id": "fake-media", "url": "https://malicious.site/ad.jpg", "name": "SpamAd.jpg", "size": "100 MB", "folder": "Behind The Scenes"}`

### Payload 12: Fraudulent Traffic Incrementor (Visitor Stats Manipulation)
An external client directly updates the traffic counters to billions of pageviews, skewing telemetry.
- **Path**: `/stats/visitors`
- **Payload**: `{"count": 999999999}`

---

## 3. The Rules Test Definitions: `firestore.rules.test.ts`

The following TypeScript code demonstrates our test coverage specification. It uses the Firebase security rules local unit testing framework to execute evaluations of the "Dirty Dozen" payloads.

```typescript
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import { doc, setDoc, getDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'metal-goods-n2t1j',
    firestore: {
      rules: require('fs').readFileSync('firestore.rules', 'utf8')
    }
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe('Olamide Visuals Rules Fortress negative testing', () => {
  test('Payload 1: Reject unauthenticated admin profile manipulation', async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(unauthedDb, 'profile', 'admin_user'), {
        username: 'attacker',
        fullName: 'Attacker Hack',
        email: 'attacker@gmail.com',
        phone: '08142870306',
        avatarUrl: '',
        twoFactorEnabled: false,
        isAdmin: true
      })
    );
  });

  test('Payload 2: Reject pre-confirmed bookings on creation by default users', async () => {
    const context = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(context, 'bookings', 'test-booking'), {
        id: 'test-booking',
        name: 'Fake Booking',
        email: 'client@gmail.com',
        phone: '08142870306',
        eventType: 'Portrait',
        preferredDate: '2026-07-10',
        message: 'High-contrast',
        createdAt: new Date().toISOString(),
        status: 'confirmed'
      })
    );
  });

  test('Payload 3: Reject unauthenticated transaction logging', async () => {
    const context = testEnv.unauthenticatedContext().firestore();
    await assertFails(
      setDoc(doc(context, 'transactions', 'fake-tx'), {
        id: 'fake-tx',
        bookingId: 'BK-5482',
        clientName: 'Osas',
        amount: 1000000,
        method: 'Paystack',
        status: 'completed',
        date: new Date().toISOString(),
        invoiceNo: 'INV-123'
      })
    );
  });

  test('Payload 7: Reject guest viewing client messages inbox', async () => {
    const context = testEnv.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(context, 'messages', 'msg-1')));
  });
});
```
