/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
  color?: string; // Default to gold or currentColor
}

/**
 * CameraHandsLogo
 * A highly polished, bespoke line art SVG representation of two hands holding a camera.
 * Hand-crafted to match the custom aesthetic of Olamide Visuals.
 */
export function CameraHandsLogo({ className = '', size = 48, color = 'currentColor' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* CAMERA BODY */}
      <path
        d="M 36 45 C 36 41, 38 39, 41 39 L 47 39 C 49 39, 51 37, 53 34 L 56 30 C 58 27, 62 27, 64 30 L 67 34 C 69 37, 71 39, 73 39 L 79 39 C 82 39, 84 41, 84 45 L 84 75 C 84 78, 82 80, 79 80 L 41 80 C 38 80, 36 78, 36 75 Z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* LENS */}
      <circle cx="60" cy="60" r="14" stroke={color} strokeWidth="2.2" />
      <circle cx="60" cy="60" r="9" stroke={color} strokeWidth="1.5" />
      <path 
        d="M 57 56 A 5 5 0 0 1 63 56" 
        stroke={color} 
        strokeWidth="1.2" 
        strokeLinecap="round" 
      />
      
      {/* SHUTTER BUTTON */}
      <rect x="71" y="35" width="5" height="4" rx="1" fill={color} opacity="0.4" />
      
      {/* LEFT HAND (Wrapping left side of camera) */}
      {/* Wrist & Arm */}
      <path
        d="M 12 95 C 16 85, 23 76, 28 69"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Wrist fold sleeve */}
      <path
        d="M 14 91 C 18 88, 23 88, 26 91"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Thumb - gripping upper left plate */}
      <path
        d="M 35 52 C 32 49, 29 50, 29 53 C 29 56, 32 58, 35 59"
        stroke={color}
        strokeWidth="2.0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Index Finger - curved wrapping left upper */}
      <path
        d="M 24 57 C 24 52, 28 48, 32 48 M 32 48 C 34 48, 36 50, 36 53"
        stroke={color}
        strokeWidth="2.0"
        strokeLinecap="round"
      />
      {/* Middle Finger - curved wrapping left middle */}
      <path
        d="M 23 63 C 22 59, 26 55, 31 55 M 31 55 C 33 55, 35 57, 35 60"
        stroke={color}
        strokeWidth="2.0"
        strokeLinecap="round"
      />
      {/* Ring Finger - curved wrapping left lower */}
      <path
        d="M 24 69 C 23 65, 27 61, 31 61 M 31 61 C 33 61, 34 63, 34 66"
        stroke={color}
        strokeWidth="2.0"
        strokeLinecap="round"
      />
      {/* Pinky Finger - curved wrapping left bottom */}
      <path
        d="M 27 75 C 26 72, 29 68, 32 68 M 32 68 C 34 68, 35 70, 35 72"
        stroke={color}
        strokeWidth="2.0"
        strokeLinecap="round"
      />

      {/* RIGHT HAND (Wrapping right side & shutter) */}
      {/* Wrist & Arm */}
      <path
        d="M 108 95 C 104 85, 97 76, 92 69"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Wrist fold sleeve */}
      <path
        d="M 106 91 C 102 88, 97 88, 94 91"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Index Finger (Shutter button trigger) - elegant arch over top right */}
      <path
        d="M 92 69 C 90 62, 87 52, 84 43 C 82 38, 76 36, 74 40 L 72 45"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Middle Finger - wrapping right middle */}
      <path
        d="M 97 57 C 97 52, 93 48, 89 48 M 89 48 C 87 48, 85 50, 85 53"
        stroke={color}
        strokeWidth="2.0"
        strokeLinecap="round"
      />
      {/* Ring Finger - wrapping right lower */}
      <path
        d="M 96 63 C 96 58, 92 54, 88 54 M 88 54 C 86 54, 85 56, 85 59"
        stroke={color}
        strokeWidth="2.0"
        strokeLinecap="round"
      />
      {/* Pinky Finger - wrapping right bottom */}
      <path
        d="M 94 70 C 94 66, 90 62, 86 62 M 86 62 C 84 62, 83 64, 83 67"
        stroke={color}
        strokeWidth="2.0"
        strokeLinecap="round"
      />
      {/* Thumb - gripping back plate */}
      <path
        d="M 85 65 C 87 67, 89 70, 88 73"
        stroke={color}
        strokeWidth="2.0"
        strokeLinecap="round"
      />
    </svg>
  );
}
