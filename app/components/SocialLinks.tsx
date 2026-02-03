import { Github, Linkedin, Mail, Globe } from "lucide-react";
import { socialLinks } from "@/lib/data";

const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12.186 24h-.007c-3.88-.024-7.377-1.582-9.908-4.015C-.277 17.458-1.33 13.573.542 9.455 1.89 6.433 4.67 4.14 7.93 2.877 9.15 2.3 10.5 2 11.94 2h.12c.65 0 1.28.05 1.89.145 2.92.36 5.54 1.58 7.58 3.57 2.02 1.96 3.28 4.39 3.65 7.02.12.85.18 1.72.18 2.6 0 .65-.03 1.3-.09 1.94-.46 3.96-2.44 7.27-5.5 9.55-2.64 1.96-5.86 3.1-9.41 3.18z" />
  </svg>
);

interface SocialLinksProps {
  className?: string;
  iconClassName?: string;
  showLabels?: boolean;
}

const SocialLinks = ({ className = "", iconClassName = "", showLabels = false }: SocialLinksProps) => {
  const getIcon = (icon: string) => {
    switch (icon) {
      case "github":
        return <Github className={iconClassName} />;
      case "linkedin":
        return <Linkedin className={iconClassName} />;
      case "threads":
        return <ThreadsIcon className={iconClassName} />;
      case "mail":
        return <Mail className={iconClassName} />;
      case "globe":
        return <Globe className={iconClassName} />;
      default:
        return null;
    }
  };

  return (
    <div className={className}>
      {socialLinks.map((link) => (
        <a
          key={link.platform}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className={iconClassName}
          aria-label={link.platform}
        >
          {getIcon(link.icon)}
          {showLabels && <span className="ml-2">{link.platform}</span>}
          {!showLabels && <span className="sr-only">{link.platform}</span>}
        </a>
      ))}
    </div>
  );
};

export default SocialLinks;