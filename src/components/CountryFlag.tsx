import React from 'react';

export const COUNTRY_NAMES: Record<string, string> = {
  ITA: 'Italia',
  USA: 'Stati Uniti',
  SRB: 'Serbia',
  ESP: 'Spagna',
  LTU: 'Lituania',
  FRA: 'Francia',
  GER: 'Germania',
  ARG: 'Argentina',
  GRE: 'Grecia',
  SLO: 'Slovenia',
  CRO: 'Croazia',
  LAT: 'Lettonia',
  BRA: 'Brasile',
  MNE: 'Montenegro',
  CAN: 'Canada',
  AUS: 'Australia',
  NGA: 'Nigeria',
};

interface CountryFlagProps {
  nationality: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({
  nationality,
  size = 'sm',
  className = '',
}) => {
  const code = nationality.toUpperCase();
  const label = COUNTRY_NAMES[code] ?? code;
  const dims =
    size === 'lg'
      ? { w: 32, h: 22 }
      : size === 'md'
      ? { w: 24, h: 17 }
      : { w: 20, h: 14 };

  const renderFlagContent = () => {
    switch (code) {
      case 'ITA':
        return (
          <>
            <rect width="10" height="21" x="0" y="0" fill="#009246" />
            <rect width="10" height="21" x="10" y="0" fill="#FFFFFF" />
            <rect width="10" height="21" x="20" y="0" fill="#CE2B37" />
          </>
        );
      case 'FRA':
        return (
          <>
            <rect width="10" height="21" x="0" y="0" fill="#0055A4" />
            <rect width="10" height="21" x="10" y="0" fill="#FFFFFF" />
            <rect width="10" height="21" x="20" y="0" fill="#EF4135" />
          </>
        );
      case 'GER':
        return (
          <>
            <rect width="30" height="7" x="0" y="0" fill="#111111" />
            <rect width="30" height="7" x="0" y="7" fill="#DD0000" />
            <rect width="30" height="7" x="0" y="14" fill="#FFCE00" />
          </>
        );
      case 'LTU':
        return (
          <>
            <rect width="30" height="7" x="0" y="0" fill="#FDB913" />
            <rect width="30" height="7" x="0" y="7" fill="#006A44" />
            <rect width="30" height="7" x="0" y="14" fill="#C1272D" />
          </>
        );
      case 'ESP':
        return (
          <>
            <rect width="30" height="5.5" x="0" y="0" fill="#AA151B" />
            <rect width="30" height="10" x="0" y="5.5" fill="#F1BF00" />
            <rect width="30" height="5.5" x="0" y="15.5" fill="#AA151B" />
            <rect width="3.5" height="5" x="6.5" y="8" rx="0.8" fill="#AA151B" />
          </>
        );
      case 'ARG':
        return (
          <>
            <rect width="30" height="7" x="0" y="0" fill="#74ACDF" />
            <rect width="30" height="7" x="0" y="7" fill="#FFFFFF" />
            <rect width="30" height="7" x="0" y="14" fill="#74ACDF" />
            <circle cx="15" cy="10.5" r="2.2" fill="#F6B40E" />
          </>
        );
      case 'LAT':
        return (
          <>
            <rect width="30" height="8.5" x="0" y="0" fill="#9E3039" />
            <rect width="30" height="4" x="0" y="8.5" fill="#FFFFFF" />
            <rect width="30" height="8.5" x="0" y="12.5" fill="#9E3039" />
          </>
        );
      case 'SRB':
        return (
          <>
            <rect width="30" height="7" x="0" y="0" fill="#C6363C" />
            <rect width="30" height="7" x="0" y="7" fill="#0C4076" />
            <rect width="30" height="7" x="0" y="14" fill="#FFFFFF" />
            <rect width="4" height="7" x="7" y="6.5" rx="1" fill="#F5C542" />
          </>
        );
      case 'CRO':
        return (
          <>
            <rect width="30" height="7" x="0" y="0" fill="#FF0000" />
            <rect width="30" height="7" x="0" y="7" fill="#FFFFFF" />
            <rect width="30" height="7" x="0" y="14" fill="#171796" />
            <rect width="5" height="6" x="12.5" y="7" rx="0.8" fill="#FF0000" />
            <rect width="2.5" height="3" x="12.5" y="7" fill="#FFFFFF" />
            <rect width="2.5" height="3" x="15" y="10" fill="#FFFFFF" />
          </>
        );
      case 'SLO':
        return (
          <>
            <rect width="30" height="7" x="0" y="0" fill="#FFFFFF" />
            <rect width="30" height="7" x="0" y="7" fill="#005DA4" />
            <rect width="30" height="7" x="0" y="14" fill="#ED1C24" />
            <rect width="4.5" height="5.5" x="6" y="4.5" rx="1" fill="#005DA4" stroke="#FFFFFF" strokeWidth="0.6" />
          </>
        );
      case 'GRE':
        return (
          <>
            <rect width="30" height="21" fill="#0D5EAF" />
            <rect width="30" height="2.4" y="2.4" fill="#FFFFFF" />
            <rect width="30" height="2.4" y="7.2" fill="#FFFFFF" />
            <rect width="30" height="2.4" y="12" fill="#FFFFFF" />
            <rect width="30" height="2.4" y="16.8" fill="#FFFFFF" />
            <rect width="12" height="11.5" x="0" y="0" fill="#0D5EAF" />
            <rect width="12" height="2.4" x="0" y="4.5" fill="#FFFFFF" />
            <rect width="2.4" height="11.5" x="4.8" y="0" fill="#FFFFFF" />
          </>
        );
      case 'USA':
        return (
          <>
            <rect width="30" height="21" fill="#B22234" />
            <rect width="30" height="2.2" y="2.2" fill="#FFFFFF" />
            <rect width="30" height="2.2" y="6.6" fill="#FFFFFF" />
            <rect width="30" height="2.2" y="11" fill="#FFFFFF" />
            <rect width="30" height="2.2" y="15.4" fill="#FFFFFF" />
            <rect width="13.5" height="11.5" x="0" y="0" fill="#3C3B6E" />
            <circle cx="3.5" cy="3" r="0.8" fill="#FFFFFF" />
            <circle cx="7" cy="3" r="0.8" fill="#FFFFFF" />
            <circle cx="10.5" cy="3" r="0.8" fill="#FFFFFF" />
            <circle cx="5.2" cy="6" r="0.8" fill="#FFFFFF" />
            <circle cx="8.8" cy="6" r="0.8" fill="#FFFFFF" />
            <circle cx="3.5" cy="9" r="0.8" fill="#FFFFFF" />
            <circle cx="7" cy="9" r="0.8" fill="#FFFFFF" />
            <circle cx="10.5" cy="9" r="0.8" fill="#FFFFFF" />
          </>
        );
      case 'BRA':
        return (
          <>
            <rect width="30" height="21" fill="#009B3A" />
            <polygon points="15,2.5 27,10.5 15,18.5 3,10.5" fill="#FEDF00" />
            <circle cx="15" cy="10.5" r="4" fill="#002776" />
          </>
        );
      case 'MNE':
        return (
          <>
            <rect width="30" height="21" fill="#C40308" stroke="#D4AF37" strokeWidth="2.2" />
            <circle cx="15" cy="10.5" r="4" fill="#D4AF37" />
          </>
        );
      case 'CAN':
        return (
          <>
            <rect width="7.5" height="21" x="0" y="0" fill="#FF0000" />
            <rect width="15" height="21" x="7.5" y="0" fill="#FFFFFF" />
            <rect width="7.5" height="21" x="22.5" y="0" fill="#FF0000" />
            <polygon points="15,5 16.5,9 19.5,9 17,11.5 18,15 15,13 12,15 13,11.5 10.5,9 13.5,9" fill="#FF0000" />
          </>
        );
      case 'AUS':
        return (
          <>
            <rect width="30" height="21" fill="#00008B" />
            <rect width="13" height="10" x="0" y="0" fill="#012169" />
            <rect width="13" height="2" x="0" y="4" fill="#FFFFFF" />
            <rect width="2" height="10" x="5.5" y="0" fill="#FFFFFF" />
            <circle cx="22" cy="6" r="1.3" fill="#FFFFFF" />
            <circle cx="25" cy="11" r="1.3" fill="#FFFFFF" />
            <circle cx="20" cy="15" r="1.3" fill="#FFFFFF" />
            <circle cx="6.5" cy="15" r="1.8" fill="#FFFFFF" />
          </>
        );
      case 'NGA':
        return (
          <>
            <rect width="10" height="21" x="0" y="0" fill="#008751" />
            <rect width="10" height="21" x="10" y="0" fill="#FFFFFF" />
            <rect width="10" height="21" x="20" y="0" fill="#008751" />
          </>
        );
      default:
        return (
          <>
            <rect width="30" height="21" fill="#334155" />
            <text
              x="15"
              y="13.5"
              textAnchor="middle"
              fontSize="8"
              fontWeight="bold"
              fill="#F8FAFC"
            >
              {code.slice(0, 3)}
            </text>
          </>
        );
    }
  };

  return (
    <span
      title={label}
      className={`inline-flex items-center justify-center shrink-0 rounded-[3px] overflow-hidden ring-1 ring-white/15 shadow-xs ${className}`}
      style={{ width: dims.w, height: dims.h }}
    >
      <svg
        viewBox="0 0 30 21"
        width={dims.w}
        height={dims.h}
        aria-label={label}
        className="block"
      >
        {renderFlagContent()}
      </svg>
    </span>
  );
};

interface FormationBadgeProps {
  isItalianFormation: boolean;
  className?: string;
}

export const FormationBadge: React.FC<FormationBadgeProps> = ({
  isItalianFormation,
  className = '',
}) => (
  <span
    title={
      isItalianFormation
        ? 'Giocatore di Formazione Italiana (Regola 6+6 LBA)'
        : 'Giocatore Straniero (Quota Stranieri 6+6 LBA)'
    }
    className={`inline-flex items-center px-1.5 py-0.5 rounded font-black text-[9px] tracking-wide uppercase border shrink-0 ${
      isItalianFormation
        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
        : 'bg-amber-500/15 text-amber-300 border-amber-500/35'
    } ${className}`}
  >
    {isItalianFormation ? 'ITA' : 'STR'}
  </span>
);
