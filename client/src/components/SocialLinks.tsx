import { FaGithub, FaLinkedin, FaTwitter } from "react-icons/fa";
import { Mail } from "lucide-react";
import { socialLinks } from "@/lib/data";

interface SocialLinksProps {
  className?: string;
  iconClassName?: string;
  showLabels?: boolean;
}

const SocialLinks = ({ className = "", iconClassName = "", showLabels = false }: SocialLinksProps) => {
  const getIcon = (icon: string) => {
    switch (icon) {
      case "github":
        return <FaGithub />;
      case "linkedin":
        return <FaLinkedin />;
      case "twitter":
        return <FaTwitter />;
      case "mail":
        return <Mail />;
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
