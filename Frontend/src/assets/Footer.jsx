import "./Footer.css";

function Footer() {
  return (
    <footer className="site-footer">
      <p className="footer-copyright">
        &copy; {new Date().getFullYear()} Learnly. All rights reserved.
      </p>
    </footer>
  );
}

export default Footer;