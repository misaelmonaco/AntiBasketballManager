import React from 'react';
import { ManagerAvatarConfig } from '../types';
import { COACH_FACE_PRESETS } from '../engine/managerEngine';

interface ManagerAvatarProps {
  avatar: ManagerAvatarConfig;
  clubColor?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ManagerAvatar: React.FC<ManagerAvatarProps> = ({
  avatar,
  clubColor = '#f97316',
  size = 'md',
  className = '',
}) => {
  const px = size === 'xl' ? 112 : size === 'lg' ? 84 : size === 'md' ? 56 : 38;

  const presetThumb = avatar.coachPresetId
    ? COACH_FACE_PRESETS.find((p) => p.id === avatar.coachPresetId)?.thumbPath
    : undefined;

  const photoSrc = avatar.customPhotoDataUrl || presetThumb;

  if (photoSrc) {
    return (
      <div
        className={`rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-800 shrink-0 shadow-lg ${className}`}
        style={{ width: px, height: px }}
      >
        <img
          src={photoSrc}
          alt="Avatar Manager"
          className="w-full h-full object-cover object-top"
        />
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl overflow-hidden border-2 border-slate-700 bg-gradient-to-b from-slate-800 to-slate-900 shrink-0 shadow-lg ${className}`}
      style={{ width: px, height: px }}
    >
      <svg viewBox="0 0 100 100" width={px} height={px} className="block">
        {/* Background subtle glow */}
        <circle cx="50" cy="45" r="42" fill={clubColor} fillOpacity="0.14" />

        {/* Outfit / Shoulders */}
        {avatar.outfit === 'suit' && (
          <g>
            <path d="M12 100 C12 74, 30 68, 50 68 C70 68, 88 74, 88 100 Z" fill="#1e293b" />
            <polygon points="40,68 60,68 50,94" fill="#f8fafc" />
            <polygon points="48,72 52,72 53,92 50,96 47,92" fill={clubColor} />
            <polygon points="40,68 47,76 42,84 35,73" fill="#0f172a" />
            <polygon points="60,68 53,76 58,84 65,73" fill="#0f172a" />
          </g>
        )}
        {avatar.outfit === 'blazer' && (
          <g>
            <path d="M12 100 C12 74, 30 68, 50 68 C70 68, 88 74, 88 100 Z" fill="#334155" />
            <polygon points="41,68 59,68 50,90" fill="#e2e8f0" />
            <path d="M43 68 L50 78 L57 68" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
          </g>
        )}
        {avatar.outfit === 'polo' && (
          <g>
            <path d="M12 100 C12 74, 30 68, 50 68 C70 68, 88 74, 88 100 Z" fill={clubColor} />
            <path d="M40 68 L50 79 L60 68" fill="#0f172a" fillOpacity="0.25" />
            <rect x="48.5" y="75" width="3" height="10" rx="1" fill="#0f172a" fillOpacity="0.35" />
          </g>
        )}

        {/* Neck */}
        <rect x="43" y="56" width="14" height="15" rx="4" fill={avatar.skinTone} />
        <path d="M43 60 Q50 66 57 60" fill="#000000" fillOpacity="0.12" />

        {/* Ears */}
        <circle cx="29" cy="43" r="4.5" fill={avatar.skinTone} />
        <circle cx="71" cy="43" r="4.5" fill={avatar.skinTone} />

        {/* Head */}
        <rect x="31" y="20" width="38" height="44" rx="18" fill={avatar.skinTone} />

        {/* Hair */}
        {avatar.hairStyle === 'short' && (
          <path
            d="M30 35 C30 16, 70 16, 70 35 C67 27, 58 24, 50 24 C42 24, 33 27, 30 35 Z"
            fill={avatar.hairColor}
          />
        )}
        {avatar.hairStyle === 'classic' && (
          <path
            d="M29 36 C28 14, 72 14, 71 36 C67 26, 59 22, 46 25 C38 27, 33 29, 29 36 Z"
            fill={avatar.hairColor}
          />
        )}
        {avatar.hairStyle === 'curly' && (
          <g fill={avatar.hairColor}>
            <circle cx="35" cy="24" r="7" />
            <circle cx="45" cy="19" r="8" />
            <circle cx="56" cy="19" r="8" />
            <circle cx="65" cy="24" r="7" />
            <circle cx="31" cy="31" r="5" />
            <circle cx="69" cy="31" r="5" />
          </g>
        )}
        {avatar.hairStyle === 'receding' && (
          <g fill={avatar.hairColor}>
            <path d="M30 36 C30 26, 35 22, 39 25 L35 35 Z" />
            <path d="M70 36 C70 26, 65 22, 61 25 L65 35 Z" />
            <path d="M41 21 C47 18, 53 18, 59 21 C54 22, 46 22, 41 21 Z" />
          </g>
        )}

        {/* Eyebrows & Eyes */}
        <path d="M37 37 Q41 35 45 37" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" fill="none" />
        <path d="M55 37 Q59 35 63 37" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" fill="none" />
        <circle cx="41" cy="41.5" r="2.2" fill="#0f172a" />
        <circle cx="59" cy="41.5" r="2.2" fill="#0f172a" />

        {/* Nose */}
        <path d="M50 42 L48.5 49 L52 49.5" stroke="#000000" strokeOpacity="0.22" strokeWidth="1.6" strokeLinecap="round" fill="none" />

        {/* Beard / Mustache */}
        {avatar.beardStyle === 'stubble' && (
          <path
            d="M32 48 C32 61, 68 61, 68 48 C65 56, 35 56, 32 48 Z"
            fill={avatar.hairColor}
            fillOpacity="0.28"
          />
        )}
        {avatar.beardStyle === 'full' && (
          <path
            d="M31 45 C31 64, 69 64, 69 45 L65 48 C63 54, 56 54, 50 54 C44 54, 37 54, 35 48 Z"
            fill={avatar.hairColor}
            fillOpacity="0.92"
          />
        )}
        {(avatar.beardStyle === 'mustache' || avatar.beardStyle === 'full') && (
          <path
            d="M42 52 Q50 49 58 52 Q54 54.5 50 53.5 Q46 54.5 42 52 Z"
            fill={avatar.hairColor}
          />
        )}

        {/* Mouth */}
        <path
          d="M44 55.5 Q50 58 56 55.5"
          stroke={avatar.beardStyle === 'full' ? '#f8fafc' : '#7c2d12'}
          strokeOpacity={avatar.beardStyle === 'full' ? 0.65 : 0.7}
          strokeWidth="1.7"
          strokeLinecap="round"
          fill="none"
        />

        {/* Glasses */}
        {avatar.glasses && (
          <g stroke="#0f172a" strokeWidth="1.7" fill="none">
            <rect x="35" y="37.5" width="12" height="8" rx="2" fill="#ffffff" fillOpacity="0.12" />
            <rect x="53" y="37.5" width="12" height="8" rx="2" fill="#ffffff" fillOpacity="0.12" />
            <line x1="47" y1="41" x2="53" y2="41" />
          </g>
        )}
      </svg>
    </div>
  );
};
