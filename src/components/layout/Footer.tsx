import { Facebook, Twitter, Instagram, Youtube, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  const footerLinks = {
    producto: [
      { label: "Características", href: "#features" },
      { label: "Beneficios", href: "#benefits" },
      { label: "Conectividad", href: "#connectivity" },
      { label: "App Móvil", href: "#mobile" },
    ],
    recursos: [
      { label: "Centro de Ayuda", href: "/auth", isRoute: true },
      { label: "Tutoriales en Video", href: "/auth", isRoute: true },
      { label: "Manual de Usuario", href: "/auth", isRoute: true },
      { label: "Blog", href: "#" },
    ],
    empresa: [
      { label: "Sobre Nosotros", href: "#" },
      { label: "Contacto", href: "#cta" },
      { label: "Carreras", href: "#" },
      { label: "Socios", href: "#" },
    ],
    legal: [
      { label: "Términos de Servicio", href: "/terminos", isRoute: true },
      { label: "Política de Privacidad", href: "/privacidad", isRoute: true },
      { label: "Cookies", href: "/cookies", isRoute: true },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "https://facebook.com/agrodataapp", label: "Facebook" },
    { icon: Twitter, href: "https://twitter.com/agrodataapp", label: "Twitter" },
    { icon: Instagram, href: "https://instagram.com/agrodataapp", label: "Instagram" },
    { icon: Youtube, href: "https://youtube.com/@agrodataapp", label: "Youtube" },
    { icon: Linkedin, href: "https://linkedin.com/company/agrodataapp", label: "LinkedIn" },
  ];

  const handleAnchorClick = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="bg-foreground py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-xl">A</span>
              </div>
              <span className="font-bold text-xl text-background">Agro Data</span>
            </Link>
            <p className="text-background/60 text-sm mb-6 max-w-xs">
              El sistema de gestión ganadera más completo de Latinoamérica. 
              Optimiza tu producción con tecnología e inteligencia artificial.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-background/10 flex items-center justify-center text-background/60 hover:bg-accent hover:text-accent-foreground transition-all"
                  aria-label={social.label}
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-bold text-background mb-4">Producto</h4>
            <ul className="space-y-3">
              {footerLinks.producto.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith('#') ? (
                    <button
                      onClick={() => handleAnchorClick(link.href)}
                      className="text-background/60 text-sm hover:text-accent transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-background/60 text-sm hover:text-accent transition-colors"
                    >
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-background mb-4">Recursos</h4>
            <ul className="space-y-3">
              {footerLinks.recursos.map((link) => (
                <li key={link.label}>
                  {link.isRoute ? (
                    <Link
                      to={link.href}
                      className="text-background/60 text-sm hover:text-accent transition-colors"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <button
                      onClick={() => handleAnchorClick(link.href)}
                      className="text-background/60 text-sm hover:text-accent transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-background mb-4">Empresa</h4>
            <ul className="space-y-3">
              {footerLinks.empresa.map((link) => (
                <li key={link.label}>
                  <button
                    onClick={() => handleAnchorClick(link.href)}
                    className="text-background/60 text-sm hover:text-accent transition-colors text-left"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-background mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-background/60 text-sm hover:text-accent transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/40 text-sm">
            © {new Date().getFullYear()} Agro Data. Todos los derechos reservados.
          </p>
          <p className="text-background/40 text-sm">
            Hecho con 💚 para ganaderos de Latinoamérica
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
