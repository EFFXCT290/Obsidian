import Image from 'next/image';

interface SidebarHeaderProps {
  brandingName: string;
}

export default function SidebarHeader({ brandingName }: SidebarHeaderProps) {
  return (
    <div className="lg:hidden p-4">
      <div className="flex items-center space-x-3">
        <Image 
          src="/logo.png" 
          alt="Obsidian logo" 
          width={40} 
          height={40} 
          priority 
          className="flex-shrink-0"
        />
        <h1 className="text-lg font-bold text-primary leading-tight">
          {brandingName}
        </h1>
      </div>
    </div>
  );
}
