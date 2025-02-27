import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiX, FiMenu, FiMail, FiGithub, FiLinkedin } from 'react-icons/fi';
import PropTypes from 'prop-types';

const Navbar = ({ portfolio, userDetails }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero');
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      const sections = ['hero', 'about', 'stats', 'projects', 'testimonials'];
      let current = 'hero';
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element && window.scrollY >= element.offsetTop - 100) {
          current = section;
        }
      }
      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      window.scrollTo({
        top: section.offsetTop - 80,
        behavior: 'smooth',
      });
      setIsOpen(false);
    }
  };

  const handleBackgroundClick = (e) => {
    // Close menu only if clicking outside the content (not on buttons/links)
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  const navItems = [
    { id: 'hero', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'stats', label: 'Stats' },
    //{ id: 'projects', label: 'Projects' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="container flex items-center justify-between px-6 py-4 mx-auto">
        <Link
          to="/"
          className={`text-2xl font-bold transition-colors duration-300 ${
            isScrolled ? 'text-blue-600' : 'text-white'
          }`}
        >
          {portfolio?.name || 'Portfolio'}
        </Link>

        {/* Desktop Navigation */}
        <div className="items-center hidden space-x-8 md:flex">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`relative text-lg font-medium transition-colors duration-300 ${
                isScrolled ? 'text-gray-700 hover:text-blue-600' : 'text-white hover:text-blue-200'
              } ${activeSection === item.id ? 'text-blue-600' : ''}`}
            >
              {item.label}
              <span
                className={`absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600 transform transition-transform duration-300 ${
                  activeSection === item.id ? 'scale-x-100' : 'scale-x-0'
                }`}
              ></span>
            </button>
          ))}
          <div className="flex items-center space-x-4">
            {portfolio?.github && (
              <a
                href={portfolio.github}
                target="_blank"
                rel="noopener noreferrer"
                className={`${
                  isScrolled ? 'text-gray-600 hover:text-blue-600' : 'text-white hover:text-blue-200'
                } transition-colors duration-300`}
              >
                <FiGithub className="w-6 h-6" />
              </a>
            )}
            {portfolio?.linkedin && (
              <a
                href={portfolio.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className={`${
                  isScrolled ? 'text-gray-600 hover:text-blue-600' : 'text-white hover:text-blue-200'
                } transition-colors duration-300`}
              >
                <FiLinkedin className="w-6 h-6" />
              </a>
            )}
            <button
              onClick={() => (window.location.href = `mailto:${portfolio?.email || userDetails?.email || ''}`)}
              className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                isScrolled ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-white text-blue-600 hover:bg-blue-50'
              }`}
            >
              <FiMail className="inline w-5 h-5 mr-2" /> Contact
            </button>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="relative flex items-center justify-center w-8 h-8 md:hidden focus:outline-none"
          onClick={() => setIsOpen(!isOpen)}
        >
          <FiMenu
            className={`w-8 h-8 absolute transition-all duration-300 ease-in-out ${
              isScrolled ? 'text-blue-600' : 'text-white'
            } ${isOpen ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`}
          />
          <FiX
            className={`w-8 h-8 absolute text-blue-600 transition-all duration-300 ease-in-out ${
              isOpen ? 'opacity-0 rotate-90 scale-0' : 'opacity-0 rotate-90 scale-0'
            }`}
          />
        </button>
      </div>

      {/* Mobile Navigation */}
      <div
        className={`md:hidden fixed inset-0 bg-white transition-opacity duration-500 ease-in-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleBackgroundClick}
      >
        <div className="relative flex flex-col items-center justify-center h-full px-6 py-4 space-y-6">
          {/* Close Button Inside Mobile Menu */}
          <button
            className="absolute top-4 right-6 focus:outline-none"
            onClick={() => setIsOpen(false)}
          >
            <FiX
              className="w-10 h-10 text-blue-600 transition-transform duration-300 ease-in-out hover:rotate-90"
            />
          </button>

          {navItems.map((item, index) => (
            <button
              key={item.id}
              onClick={() => scrollToSection(item.id)}
              className={`w-full text-center py-3 px-4 rounded-md text-gray-700 text-xl font-medium transition-all duration-300 ease-in-out hover:bg-blue-50 hover:text-blue-600 ${
                activeSection === item.id ? 'bg-blue-50 text-blue-600' : ''
              } ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {item.label}
            </button>
          ))}
          <div
            className={`flex justify-center pt-6 space-x-6 ${
              isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: `${navItems.length * 100}ms` }}
          >
            {portfolio?.github && (
              <a
                href={portfolio.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 transition-all duration-300 ease-in-out hover:text-blue-600"
              >
                <FiGithub className="w-8 h-8" />
              </a>
            )}
            {portfolio?.linkedin && (
              <a
                href={portfolio.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 transition-all duration-300 ease-in-out hover:text-blue-600"
              >
                <FiLinkedin className="w-8 h-8" />
              </a>
            )}
          </div>
          <button
            onClick={() => {
              window.location.href = `mailto:${portfolio?.email || userDetails?.email || ''}`;
              setIsOpen(false);
            }}
            className={`w-3/4 py-4 text-white text-lg font-medium transition-all duration-300 ease-in-out bg-blue-600 rounded-full hover:bg-blue-700 ${
              isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
            style={{ transitionDelay: `${(navItems.length + 1) * 100}ms` }}
          >
            <FiMail className="inline w-6 h-6 mr-2" /> Contact Me
          </button>
        </div>
      </div>
    </nav>
  );
};

Navbar.propTypes = {
  portfolio: PropTypes.shape({
    name: PropTypes.string,
    github: PropTypes.string,
    linkedin: PropTypes.string,
    email: PropTypes.string,
  }),
  userDetails: PropTypes.shape({
    email: PropTypes.string,
  }),
};

export default Navbar;