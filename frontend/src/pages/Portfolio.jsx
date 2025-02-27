import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FiUser, FiBriefcase, FiFolder, FiCalendar, FiAlertCircle, FiClock, 
  FiDollarSign, FiUsers, FiMail, FiExternalLink, FiGithub, FiLinkedin 
} from 'react-icons/fi';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import { PortfolioProvider, usePortfolio } from '../contexts/PortfolioContext';
import Navbar from '../components/Navbar';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

const PortfolioWrapper = () => {
  return (
    <PortfolioProvider>
      <PortfolioContent />
    </PortfolioProvider>
  );
};

const PortfolioContent = () => {
  const { username } = useParams();
  const { state, dispatch } = usePortfolio();
  const { portfolio, stats, userDetails, loading, error } = state;
  
  const aboutRef = useRef(null);
  const projectsRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        const portfolioRes = await axios.get(`/api/portfolio/${username}`, {
          headers: { 'Cache-Control': 'no-cache' },
          responseType: 'json'
        });
        console.log('Portfolio data:', portfolioRes.data);
        dispatch({ type: 'SET_PORTFOLIO', payload: portfolioRes.data });

        const userRes = await axios.get('/api/auth/user', { 
          params: { username }, 
          headers: { 'Cache-Control': 'no-cache' },
          responseType: 'json'
        });
        console.log('User details:', userRes.data);
        dispatch({ type: 'SET_USER_DETAILS', payload: userRes.data });

        const [projectsRes, timeRes, invoicesRes, clientsRes] = await Promise.all([
          axios.get(`/api/projects/stats?username=${username}`, { headers: { 'Cache-Control': 'no-cache' }, responseType: 'json' }),
          axios.get(`/api/time/summary?username=${username}`, { headers: { 'Cache-Control': 'no-cache' }, responseType: 'json' }),
          axios.get(`/api/invoices/stats?username=${username}`, { headers: { 'Cache-Control': 'no-cache' }, responseType: 'json' }),
          axios.get(`/api/clients/?username=${username}`, { headers: { 'Cache-Control': 'no-cache' }, responseType: 'json' })
        ]);

        dispatch({ 
          type: 'SET_STATS', 
          payload: {
            projects: projectsRes.data,
            time: timeRes.data,
            invoices: invoicesRes.data,
            clients: Array.isArray(clientsRes.data) ? clientsRes.data.length : 0
          }
        });

        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (err) {
        console.error('Portfolio loading error:', err.response?.data || err);
        dispatch({ 
          type: 'SET_ERROR', 
          payload: err.response?.status === 404
            ? 'This portfolio does not exist or is private'
            : 'Failed to load portfolio'
        });
      }
    };

    fetchData();
  }, [username, dispatch]);

  useEffect(() => {
    if (portfolio?.profile_image) {
      console.log('Portfolio profile image updated:', portfolio.profile_image);
    }
    if (stats.projects?.recent_projects) {
      console.log('Projects data in Portfolio:', stats.projects.recent_projects);
      console.log('Filtered public projects:', stats.projects.recent_projects.filter(p => p.is_public));
    }
  }, [portfolio?.profile_image, stats.projects]);

  const timeChartData = {
    labels: stats.time.hours_by_day?.slice(-7).map(day => new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })) || [],
    datasets: [
      {
        label: 'Hours Worked',
        data: stats.time.hours_by_day?.slice(-7).map(day => day.hours) || [],
        borderColor: 'rgba(59, 130, 246, 0.8)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        tension: 0.4,
        fill: true,
        borderWidth: 2,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: 'rgba(59, 130, 246, 0.8)',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  // Helper function to get status color from Projects.jsx
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-amber-100 text-amber-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-t-4 border-b-4 border-blue-600 rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-600">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md p-8 text-center bg-white shadow-lg rounded-xl"
        >
          <FiAlertCircle className="w-16 h-16 mx-auto text-red-500" />
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Portfolio Not Found</h1>
          <p className="mt-3 text-gray-600">{error}</p>
          <Link to="/" className="inline-block px-6 py-3 mt-6 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">
            Return to Homepage
          </Link>
        </motion.div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md p-8 text-center bg-white shadow-lg rounded-xl"
        >
          <FiAlertCircle className="w-16 h-16 mx-auto text-yellow-500" />
          <h1 className="mt-6 text-2xl font-bold text-gray-900">Portfolio Not Available</h1>
          <p className="mt-3 text-gray-600">This user hasn&apos;t set up their portfolio yet.</p>
          <Link to="/" className="inline-block px-6 py-3 mt-6 text-white transition-colors bg-blue-600 rounded-lg hover:bg-blue-700">
            Return to Homepage
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar portfolio={portfolio} userDetails={userDetails} />

      {/* Hero Section */}
      <section id="hero" className="relative flex items-center justify-center min-h-screen text-white bg-gradient-to-br from-blue-600 to-indigo-700">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="container z-10 px-6 mx-auto">
          <motion.div 
            key={portfolio.profile_image || 'default'} // Force re-render on image change
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center text-center"
          >
            <div className="relative mb-8">
              {portfolio.profile_image ? (
                <img 
                  src={portfolio.profile_image.startsWith('http') ? portfolio.profile_image : `http://localhost:5001${portfolio.profile_image}`} 
                  alt={portfolio.name}
                  className="object-cover w-32 h-32 border-4 border-white rounded-full shadow-xl"
                  loading="eager"
                  onError={(e) => {
                    console.error('Profile image load error:', {
                      error: e,
                      url: portfolio.profile_image,
                      message: 'Failed to load profile image',
                      status: e.nativeEvent?.status || 'Unknown'
                    });
                    // Fallback to default icon if image fails, but log detailed info
                  }}
                />
              ) : (
                <div className="flex items-center justify-center w-32 h-32 bg-blue-500 rounded-full shadow-xl">
                  <FiUser className="w-16 h-16 text-white" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 flex items-center justify-center w-10 h-10 bg-blue-400 rounded-full shadow-md">
                <FiBriefcase className="w-5 h-5 text-white" />
              </div>
            </div>
            <h1 className="mb-4 text-4xl font-bold md:text-5xl lg:text-6xl">{portfolio.name}</h1>
            <h2 className="mb-6 text-xl font-medium text-blue-200 md:text-2xl">{portfolio.specialization || 'Freelancer'}</h2>
            <p className="max-w-2xl mb-8 text-lg leading-relaxed">
              {portfolio.bio || `Experienced freelancer specializing in ${portfolio.specialization || 'professional services'}.`}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="#projects" 
                className="px-6 py-3 text-white transition-all duration-300 bg-blue-500 rounded-full shadow-md hover:bg-blue-600"
              >
                View My Work
              </a>
              <button
                onClick={() => window.location.href = `mailto:${portfolio.email || userDetails?.email || ''}`}
                className="px-6 py-3 text-blue-600 transition-all duration-300 bg-white rounded-full shadow-md hover:bg-blue-50"
              >
                Contact Me
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" ref={aboutRef} className="relative flex items-center justify-center min-h-screen mt-10 mb-10">
        <div className="container px-6 mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="mb-12 text-4xl font-bold text-center text-gray-900">About Me</h2>
            <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-blue-600">My Background</h3>
                <p className="leading-relaxed text-gray-700">
                  {portfolio.bio || 'I’m a dedicated freelancer with a passion for delivering high-quality work.'}
                </p>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-12 h-12 mr-4 bg-blue-100 rounded-full">
                      <FiBriefcase className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Specialization</h4>
                      <p className="text-gray-600">{portfolio.specialization || 'Freelancer'}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-12 h-12 mr-4 bg-blue-100 rounded-full">
                      <FiUser className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Username</h4>
                      <p className="text-gray-600">@{portfolio.username}</p>
                    </div>
                  </div>
                  {userDetails?.email && (
                    <div className="flex items-center">
                      <div className="flex items-center justify-center w-12 h-12 mr-4 bg-blue-100 rounded-full">
                        <FiMail className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Email</h4>
                        <p className="text-gray-600">{userDetails.email}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-6">
                <h3 className="text-2xl font-semibold text-blue-600">My Expertise</h3>
                <div className="space-y-4">
                  {portfolio.specialization && typeof portfolio.specialization === 'string' ? (
                    portfolio.specialization.split(',').map((skill, index) => (
                      <div key={index} className="relative pt-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">{skill.trim()}</span>
                          <span className="text-sm font-medium text-blue-600">{85 + (index * 5) % 15}%</span>
                        </div>
                        <div className="flex h-2 overflow-hidden bg-gray-200 rounded-full">
                          <motion.div 
                            initial={{ width: 0 }}
                            whileInView={{ width: `${85 + (index * 5) % 15}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="bg-blue-500 rounded-full"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="italic text-gray-600">No specific expertise listed yet.</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" ref={statsRef} className="relative flex items-center justify-center min-h-screen mt-10 mb-10">
        <div className="container px-6 mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="mb-12 text-4xl font-bold text-center text-gray-900">My Performance</h2>
            <div className="grid grid-cols-1 gap-6 mb-12 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: FiFolder, value: stats.projects.total, label: 'Projects', color: 'blue-600' },
                { icon: FiClock, value: stats.time.total_hours.toFixed(0), label: 'Hours', color: 'blue-600' },
                { icon: FiDollarSign, value: `$${stats.invoices.total_paid.toFixed(0)}`, label: 'Earnings', color: 'blue-600' },
                { icon: FiUsers, value: stats.clients, label: 'Clients', color: 'blue-600' },
              ].map((stat, index) => (
                <motion.div 
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="p-6 transition-shadow duration-300 bg-white rounded-lg shadow-md hover:shadow-lg"
                >
                  <div className={`flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-${stat.color}-100 rounded-full`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}`} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                  <p className="text-gray-600">{stat.label}</p>
                </motion.div>
              ))}
            </div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="p-6 bg-white rounded-lg shadow-md"
            >
              <h3 className="mb-6 text-2xl font-semibold text-gray-900">Recent Activity</h3>
              {stats.time.hours_by_day?.length > 0 ? (
                <div className="h-72">
                  <Line
                    data={timeChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: { 
                          beginAtZero: true, 
                          title: { display: true, text: 'Hours', color: '#4B5563' },
                          grid: { color: 'rgba(0, 0, 0, 0.05)' }
                        },
                        x: { 
                          title: { display: true, text: 'Date', color: '#4B5563' },
                          grid: { display: false }
                        },
                      },
                      plugins: { 
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          titleColor: '#1F2937',
                          bodyColor: '#1F2937',
                          borderColor: '#E5E7EB',
                          borderWidth: 1,
                          padding: 12,
                        }
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center text-gray-600 h-72">
                  <FiClock className="w-8 h-8 mr-2 text-blue-500" />
                  No recent activity available
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Projects Section (Attractive Visualization) */}
      <section id="projects" ref={projectsRef} className="relative flex items-center justify-center min-h-screen mt-10 mb-10">
        <div className="container px-6 mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-6xl mx-auto"
          >
            <h2 className="mb-12 text-4xl font-bold text-center text-gray-900">Featured Projects</h2>
            {stats.projects.recent_projects?.length > 0 ? (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {stats.projects.recent_projects.filter(p => p.is_public).map((project, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="overflow-hidden transition-all duration-300 bg-white shadow-lg rounded-xl hover:shadow-xl hover:scale-105"
                  >
                    <div className="h-48 overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600">
                      {project.image ? (
                        <img src={project.image} alt={project.title} className="object-cover w-full h-full transition-opacity duration-300 hover:opacity-90" />
                      ) : (
                        <div className="flex items-center justify-center w-full h-full bg-blue-600">
                          <FiFolder className="w-16 h-16 text-white opacity-80" />
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center px-3 py-1 text-xs font-semibold text-blue-800 bg-blue-200 rounded-full bg-opacity-20">
                          {project.category || 'Project'}
                        </span>
                        <span className="flex items-center text-sm text-gray-500">
                          <FiCalendar className="w-4 h-4 mr-1" />
                          {project.start_date ? new Date(project.start_date).getFullYear() : 'N/A'}
                        </span>
                      </div>
                      <h3 className="mb-2 text-xl font-bold text-gray-900 transition-colors duration-200 line-clamp-1 hover:text-primary-600">
                        <Link to={`/projects/${project.id}`}>{project.title}</Link>
                      </h3>
                      <p className="mb-4 text-gray-600 transition-opacity duration-200 line-clamp-2 hover:opacity-90">
                        {project.description || 'No description provided'}
                      </p>
                      <div className="flex justify-between text-sm text-gray-700">
                        <span className="flex items-center">
                          <FiClock className="w-4 h-4 mr-1 text-gray-500" />
                          {project.total_hours.toFixed(1)} hrs
                        </span>
                        <span className="flex items-center">
                          <FiDollarSign className="w-4 h-4 mr-1 text-gray-500" />
                          ${project.total_billed.toFixed(0)}
                        </span>
                      </div>
                      <div className="mt-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)} transition-colors duration-200 hover:opacity-80`}>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center shadow-md rounded-xl bg-gray-50">
                <FiFolder className="w-16 h-16 mx-auto mb-4 text-blue-500 opacity-80" />
                <p className="text-gray-600">No public projects available at this time. Please ensure there are completed, public projects for this user.</p>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-600">
        <div className="container px-6 mx-auto">
          <div className="flex justify-center space-x-6">
            {portfolio.github ? (
              <a href={portfolio.github} target="_blank" rel="noopener noreferrer" className="text-gray-300 transition-colors hover:text-blue-400">
                <FiGithub className="w-6 h-6" />
              </a>
            ) : (
              <span className="text-gray-200"><FiGithub className="w-6 h-6 opacity-50" /></span>
            )}
            {portfolio.linkedin ? (
              <a href={portfolio.linkedin} target="_blank" rel="noopener noreferrer" className="text-gray-300 transition-colors hover:text-blue-400">
                <FiLinkedin className="w-6 h-6" />
              </a>
            ) : (
              <span className="text-gray-200"><FiLinkedin className="w-6 h-6 opacity-50" /></span>
            )}
            {portfolio.website ? (
              <a href={portfolio.website} target="_blank" rel="noopener noreferrer" className="text-gray-300 transition-colors hover:text-blue-400">
                <FiExternalLink className="w-6 h-6" />
              </a>
            ) : (
              <span className="text-gray-200"><FiExternalLink className="w-6 h-6 opacity-50" /></span>
            )}
          </div>
        </div>
      </footer>

      <ScrollToTopButton />
    </div>
  );
};

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300);
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
      }`}
    >
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
      </svg>
    </button>
  );
};

export default PortfolioWrapper;