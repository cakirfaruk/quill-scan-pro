export const NoMessagesIllustration = () => (
  <svg
    width="200"
    height="200"
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="mx-auto"
  >
    {/* Envelope */}
    <g className="animate-[bounce_3s_ease-in-out_infinite]">
      <rect
        x="40"
        y="70"
        width="120"
        height="80"
        rx="8"
        fill="hsl(var(--primary))"
        fillOpacity="0.1"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        className="animate-pulse"
      />
      <path
        d="M40 70 L100 110 L160 70"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-[draw_2s_ease-in-out_infinite]"
      />
    </g>
    {/* Floating dots */}
    <circle cx="30" cy="60" r="3" fill="hsl(var(--accent))" className="animate-[ping_2s_ease-in-out_infinite]" style={{ animationDelay: '0s' }} />
    <circle cx="170" cy="80" r="3" fill="hsl(var(--accent))" className="animate-[ping_2s_ease-in-out_infinite]" style={{ animationDelay: '0.5s' }} />
    <circle cx="50" cy="160" r="3" fill="hsl(var(--accent))" className="animate-[ping_2s_ease-in-out_infinite]" style={{ animationDelay: '1s' }} />
  </svg>
);

export const NoPostsIllustration = () => (
  <svg
    width="200"
    height="200"
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="mx-auto"
  >
    {/* Photo frame */}
    <g className="animate-[bounce_3s_ease-in-out_infinite]">
      <rect
        x="50"
        y="50"
        width="100"
        height="100"
        rx="8"
        fill="hsl(var(--primary))"
        fillOpacity="0.1"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
      />
      {/* Mountain/landscape icon */}
      <path
        d="M65 120 L85 95 L105 110 L125 85 L135 95"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-[draw_2s_ease-in-out_infinite]"
      />
      {/* Sun */}
      <circle 
        cx="120" 
        cy="70" 
        r="8" 
        fill="hsl(var(--accent))" 
        className="animate-pulse"
      />
    </g>
    {/* Plus icon */}
    <g className="animate-[spin_4s_linear_infinite]">
      <circle cx="140" cy="140" r="20" fill="hsl(var(--primary))" fillOpacity="0.2" />
      <path d="M140 130 L140 150 M130 140 L150 140" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
);

export const NoGroupsIllustration = () => (
  <svg
    width="200"
    height="200"
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="mx-auto"
  >
    {/* People icons */}
    <g className="animate-[bounce_3s_ease-in-out_infinite]" style={{ animationDelay: '0s' }}>
      <circle cx="70" cy="80" r="15" fill="hsl(var(--primary))" fillOpacity="0.3" className="animate-pulse" />
      <path d="M50 130 Q70 110 90 130" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" fill="hsl(var(--primary))" fillOpacity="0.1" />
    </g>
    <g className="animate-[bounce_3s_ease-in-out_infinite]" style={{ animationDelay: '0.3s' }}>
      <circle cx="100" cy="70" r="18" fill="hsl(var(--primary))" fillOpacity="0.5" className="animate-pulse" />
      <path d="M78 125 Q100 100 122 125" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" fill="hsl(var(--primary))" fillOpacity="0.2" />
    </g>
    <g className="animate-[bounce_3s_ease-in-out_infinite]" style={{ animationDelay: '0.6s' }}>
      <circle cx="130" cy="80" r="15" fill="hsl(var(--primary))" fillOpacity="0.3" className="animate-pulse" />
      <path d="M110 130 Q130 110 150 130" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" fill="hsl(var(--primary))" fillOpacity="0.1" />
    </g>
  </svg>
);

export const NoFriendsIllustration = () => (
  <svg
    width="200"
    height="200"
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="mx-auto"
  >
    {/* Two people shaking hands */}
    <g className="animate-[bounce_3s_ease-in-out_infinite]">
      {/* Person 1 */}
      <circle cx="65" cy="70" r="18" fill="hsl(var(--primary))" fillOpacity="0.3" className="animate-pulse" />
      <path d="M45 120 Q65 100 85 120" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" fill="hsl(var(--primary))" fillOpacity="0.1" />
      
      {/* Person 2 */}
      <circle cx="135" cy="70" r="18" fill="hsl(var(--accent))" fillOpacity="0.3" className="animate-pulse" />
      <path d="M115 120 Q135 100 155 120" stroke="hsl(var(--accent))" strokeWidth="2" strokeLinecap="round" fill="hsl(var(--accent))" fillOpacity="0.1" />
      
      {/* Heart in middle */}
      <path
        d="M100 85 L105 95 L100 105 L95 95 Z"
        fill="hsl(var(--destructive))"
        className="animate-[ping_2s_ease-in-out_infinite]"
      />
    </g>
  </svg>
);

export const NoSearchResultsIllustration = () => (
  <svg
    width="200"
    height="200"
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="mx-auto"
  >
    {/* Magnifying glass */}
    <g className="animate-[bounce_3s_ease-in-out_infinite]">
      <circle
        cx="85"
        cy="85"
        r="35"
        stroke="hsl(var(--primary))"
        strokeWidth="3"
        fill="none"
        className="animate-pulse"
      />
      <path
        d="M112 112 L140 140"
        stroke="hsl(var(--primary))"
        strokeWidth="3"
        strokeLinecap="round"
        className="animate-[wiggle_1s_ease-in-out_infinite]"
      />
    </g>
    {/* Question mark */}
    <text
      x="82"
      y="100"
      fontSize="40"
      fill="hsl(var(--primary))"
      fillOpacity="0.5"
      className="animate-pulse"
    >
      ?
    </text>
  </svg>
);

export const NoConversationIllustration = () => (
  <svg
    width="200"
    height="200"
    viewBox="0 0 200 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="mx-auto"
  >
    {/* Chat bubbles */}
    <g className="animate-[float_3s_ease-in-out_infinite]">
      <rect
        x="40"
        y="60"
        width="80"
        height="50"
        rx="12"
        fill="hsl(var(--primary))"
        fillOpacity="0.2"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        className="animate-pulse"
      />
      <path d="M60 110 L70 120 L80 110" fill="hsl(var(--primary))" fillOpacity="0.2" />
    </g>
    <g className="animate-[float_3s_ease-in-out_infinite]" style={{ animationDelay: '1s' }}>
      <rect
        x="80"
        y="100"
        width="80"
        height="50"
        rx="12"
        fill="hsl(var(--accent))"
        fillOpacity="0.2"
        stroke="hsl(var(--accent))"
        strokeWidth="2"
        className="animate-pulse"
      />
      <path d="M140 150 L130 160 L120 150" fill="hsl(var(--accent))" fillOpacity="0.2" />
    </g>
    {/* Three dots */}
    <g className="animate-[bounce_1s_ease-in-out_infinite]">
      <circle cx="65" cy="85" r="3" fill="hsl(var(--primary))" style={{ animationDelay: '0s' }} />
      <circle cx="80" cy="85" r="3" fill="hsl(var(--primary))" style={{ animationDelay: '0.2s' }} />
      <circle cx="95" cy="85" r="3" fill="hsl(var(--primary))" style={{ animationDelay: '0.4s' }} />
    </g>
  </svg>
);
