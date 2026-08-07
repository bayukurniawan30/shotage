import React, { HTMLAttributes } from 'react';

interface IllustrationProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  svgClassName?: string;
  childrenClassName?: string;
}

export const sm = ({
  className = '',
  svgClassName = '',
  childrenClassName = '',
  children = <div></div>,
  ...otherProps
}: Omit<IllustrationProps, 'size'>) => {
  return (
    <div {...otherProps} className={`relative h-16 w-24 shrink-0 ${className}`}>
      <svg
        viewBox="0 0 161 120"
        fill="none"
        className={`w-full h-full stroke-inherit text-inherit ${svgClassName}`}
      >
        <circle cx="27" cy="11" r="5" className="fill-slate-700" />
        <circle cx="24" cy="109" r="7" className="fill-slate-700" />
        <circle cx="151" cy="35" r="7" className="fill-slate-700" />
        <circle cx="140" cy="8" r="4" className="fill-slate-700" />
        <circle cx="82" cy="52" r="52" className="fill-slate-800/60" />
        <g filter="url(#documents-shadow-01-sm)">
          <path
            d="M47.7267 79.1102L80.9652 63.6108C82.634 62.8326 83.356 60.8489 82.5778 59.1801L62.9485 17.0849L49.6564 12.2469L22.4612 24.9282C20.7924 25.7064 20.0704 27.6901 20.8486 29.359L43.296 77.4975C44.0741 79.1663 46.0578 79.8883 47.7267 79.1102Z"
            fill="#ffafcc"
          />
          <path
            d="M82.8045 59.0745C83.6409 60.8685 82.8648 63.0009 81.071 63.8374L47.8323 79.3368C46.0384 80.1733 43.906 79.3971 43.0694 77.6033L20.622 29.4646L20.5484 29.2952C19.8352 27.5384 20.6177 25.5121 22.3555 24.7017L49.6448 11.9765L63.1313 16.8852L82.8045 59.0745Z"
            className="stroke-slate-700"
            strokeWidth="0.5"
          />
          <path
            d="M49.6569 12.2471L62.949 17.085L53.884 21.3121L49.6569 12.2471Z"
            className="fill-slate-600"
          />
        </g>
        <g filter="url(#documents-shadow-02-sm)">
          <path
            d="M63.6162 67.7831H100.291C102.132 67.7831 103.625 66.2904 103.625 64.4491V18.0022L93.6227 8H63.6162C61.7748 8 60.2821 9.49271 60.2821 11.3341V64.4491C60.2821 66.2904 61.7748 67.7831 63.6162 67.7831Z"
            fill="#a2d2ff"
          />
          <path
            d="M103.875 64.4492C103.875 66.4285 102.27 68.0332 100.291 68.0332H63.6161C61.6368 68.0332 60.0322 66.4285 60.0321 64.4492V11.334L60.037 11.1494C60.1331 9.25583 61.6986 7.75004 63.6161 7.75H93.7264L103.875 17.8984V64.4492Z"
            className="stroke-slate-700"
            strokeWidth="0.5"
          />
          <path d="M93.6226 8L103.625 18.0022H93.6226V8Z" className="fill-slate-600" />
        </g>
        <g filter="url(#documents-shadow-03-sm)">
          <path
            d="M82.4745 63.5909L115.713 79.0903C117.382 79.8685 119.366 79.1465 120.144 77.4777L139.773 35.3825L134.935 22.0903L107.74 9.40903C106.071 8.63085 104.087 9.35286 103.309 11.0217L80.8619 59.1602C80.0837 60.8291 80.8057 62.8128 82.4745 63.5909Z"
            fill="#cdb4db"
          />
          <path
            d="M120.37 77.5835C119.534 79.3773 117.401 80.1535 115.607 79.317L82.3688 63.8176C80.5749 62.981 79.7988 60.8486 80.6352 59.0547L103.083 10.916L103.165 10.7507C104.053 9.0752 106.108 8.37211 107.846 9.18243L135.135 21.9076L140.044 35.3941L120.37 77.5835Z"
            className="stroke-slate-700"
            strokeWidth="0.5"
          />
          <path
            d="M134.936 22.0903L139.774 35.3825L130.708 31.1554L134.936 22.0903Z"
            className="fill-slate-600"
          />
        </g>

        <defs>
          <filter
            id="documents-shadow-01-sm"
            x="-0.560448"
            y="8.0199"
            width="104.547"
            height="112.499"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feMorphology
              radius="1.5"
              operator="erode"
              in="SourceAlpha"
              result="effect1_dropShadow_1182_1949"
            />
            <feOffset dy="3" />
            <feGaussianBlur stdDeviation="1.5" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.0392157 0 0 0 0 0.0496732 0 0 0 0 0.0705882 0 0 0 0.04 0"
            />
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1182_1949" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feMorphology
              radius="4"
              operator="erode"
              in="SourceAlpha"
              result="effect2_dropShadow_1182_1949"
            />
            <feOffset dy="8" />
            <feGaussianBlur stdDeviation="4" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.0392157 0 0 0 0 0.0496732 0 0 0 0 0.0705882 0 0 0 0.03 0"
            />
            <feBlend
              mode="normal"
              in2="effect1_dropShadow_1182_1949"
              result="effect2_dropShadow_1182_1949"
            />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feMorphology
              radius="4"
              operator="erode"
              in="SourceAlpha"
              result="effect3_dropShadow_1182_1949"
            />
            <feOffset dy="20" />
            <feGaussianBlur stdDeviation="12" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.0392157 0 0 0 0 0.0496732 0 0 0 0 0.0705882 0 0 0 0.08 0"
            />
            <feBlend
              mode="normal"
              in2="effect2_dropShadow_1182_1949"
              result="effect3_dropShadow_1182_1949"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect3_dropShadow_1182_1949"
              result="shape"
            />
          </filter>
          <filter
            id="documents-shadow-02-sm"
            x="39.7821"
            y="7.5"
            width="84.3428"
            height="100.783"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feMorphology
              radius="1.5"
              operator="erode"
              in="SourceAlpha"
              result="effect1_dropShadow_1182_1949"
            />
            <feOffset dy="3" />
            <feGaussianBlur stdDeviation="1.5" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.0392157 0 0 0 0 0.0496732 0 0 0 0 0.0705882 0 0 0 0.04 0"
            />
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1182_1949" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feMorphology
              radius="4"
              operator="erode"
              in="SourceAlpha"
              result="effect2_dropShadow_1182_1949"
            />
            <feOffset dy="8" />
            <feGaussianBlur stdDeviation="4" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.0392157 0 0 0 0 0.0496732 0 0 0 0 0.0705882 0 0 0 0.03 0"
            />
            <feBlend
              mode="normal"
              in2="effect1_dropShadow_1182_1949"
              result="effect2_dropShadow_1182_1949"
            />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feMorphology
              radius="4"
              operator="erode"
              in="SourceAlpha"
              result="effect3_dropShadow_1182_1949"
            />
            <feOffset dy="20" />
            <feGaussianBlur stdDeviation="12" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.0392157 0 0 0 0 0.0496732 0 0 0 0 0.0705882 0 0 0 0.08 0"
            />
            <feBlend
              mode="normal"
              in2="effect2_dropShadow_1182_1949"
              result="effect3_dropShadow_1182_1949"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect3_dropShadow_1182_1949"
              result="shape"
            />
          </filter>
          <filter
            id="documents-shadow-03-sm"
            x="59.4529"
            y="8"
            width="104.547"
            height="112.499"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feMorphology
              radius="1.5"
              operator="erode"
              in="SourceAlpha"
              result="effect1_dropShadow_1182_1949"
            />
            <feOffset dy="3" />
            <feGaussianBlur stdDeviation="1.5" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.0392157 0 0 0 0 0.0496732 0 0 0 0 0.0705882 0 0 0 0.04 0"
            />
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1182_1949" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feMorphology
              radius="4"
              operator="erode"
              in="SourceAlpha"
              result="effect2_dropShadow_1182_1949"
            />
            <feOffset dy="8" />
            <feGaussianBlur stdDeviation="4" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.0392157 0 0 0 0 0.0496732 0 0 0 0 0.03 0"
            />
            <feBlend
              mode="normal"
              in2="effect1_dropShadow_1182_1949"
              result="effect2_dropShadow_1182_1949"
            />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feMorphology
              radius="4"
              operator="erode"
              in="SourceAlpha"
              result="effect3_dropShadow_1182_1949"
            />
            <feOffset dy="20" />
            <feGaussianBlur stdDeviation="12" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.0392157 0 0 0 0 0.0496732 0 0 0 0 0.0705882 0 0 0 0.08 0"
            />
            <feBlend
              mode="normal"
              in2="effect2_dropShadow_1182_1949"
              result="effect3_dropShadow_1182_1949"
            />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="effect3_dropShadow_1182_1949"
              result="shape"
            />
          </filter>
        </defs>
      </svg>

      {children && (
        <span
          className={`absolute left-1/2 -translate-x-1/2 bottom-1 z-10 flex w-7 h-7 is-center justify-center rounded-full bg-white/90 text-white backdrop-blur-xs shadow ${childrenClassName}`}
        >
          {children}
        </span>
      )}
    </div>
  );
};

export const DocumentsIllustration = ({ size = 'sm', ...otherProps }: IllustrationProps) => {
  return <IllustrationSm {...otherProps} />;
};

export const IllustrationSm = sm;
