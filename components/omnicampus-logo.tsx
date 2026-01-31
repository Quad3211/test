export function OmniCampusLogo({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100"
      className={className}
    >
      {/* Outer arc */}
      <path 
        d="M 15 50 A 35 35 0 1 1 50 15" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="8" 
        strokeLinecap="round"
        className="text-primary"
      />
      
      {/* Inner arc */}
      <path 
        d="M 25 50 A 25 25 0 1 1 50 25" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="6" 
        strokeLinecap="round"
        className="text-blue-400"
      />
      
      {/* Dots */}
      <circle cx="15" cy="50" r="4" fill="currentColor" className="text-primary"/>
      <circle cx="25" cy="50" r="3" fill="currentColor" className="text-blue-400"/>
      <circle cx="50" cy="15" r="4" fill="currentColor" className="text-primary"/>
      <circle cx="50" cy="25" r="3" fill="currentColor" className="text-blue-400"/>
    </svg>
  )
}