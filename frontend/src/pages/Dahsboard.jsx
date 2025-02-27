import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FiFolder, FiUsers, FiClock, FiFileText, FiAlertCircle,
  FiPlusCircle, FiTrendingUp
} from 'react-icons/fi';
import { format } from 'date-fns';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    projects: { total: 0, by_status: {}, recent_projects: [] },
    clients: { total: 0 },
    time: { total_hours: 0, billable_hours: 0, hours_by_day: [] },
    invoices: { total_invoiced: 0, total_paid: 0, pending_payment: 0, overdue_count: 0 }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [projectsRes, clientsRes, timeRes, invoicesRes] = await Promise.all([
          axios.get('/api/projects/stats'),
          axios.get('/api/clients/'),
          axios.get('/api/time/summary'),
          axios.get('/api/invoices/stats')
        ]);

        const newStats = {
          projects: projectsRes.data,
          clients: { total: Array.isArray(clientsRes.data) ? clientsRes.data.length : 0 },
          time: timeRes.data,
          invoices: invoicesRes.data
        };
        
        console.log('Fetched stats:', newStats);
        setStats(newStats);
        setLoading(false);
      } catch (err) {
        console.error('Dashboard data error:', err);
        console.error('Error response:', err.response?.data);
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const projectChartData = {
    labels: Object.keys(stats.projects.by_status || {}).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
    datasets: [
      {
        data: Object.values(stats.projects.by_status || {}),
        backgroundColor: ['#0284c7', '#22c55e', '#f59e0b', '#ef4444'],
        borderWidth: 0,
      },
    ],
  };

  const timeChartData = {
    labels: stats.time.hours_by_day?.slice(-7).map(day => format(new Date(day.date), 'MMM d')) || [],
    datasets: [
      {
        label: 'Hours Worked',
        data: stats.time.hours_by_day?.slice(-7).map(day => day.hours) || [],
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.1)',
        tension: 0.3,
        fill: true,
      },
    ],
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-t-2 border-b-2 rounded-full animate-spin border-primary-600"></div>
          <p className="mt-2 text-gray-700">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center rounded-lg bg-red-50">
        <FiAlertCircle className="w-12 h-12 mx-auto text-red-500" />
        <h3 className="mt-2 text-lg font-medium text-red-800">Error loading dashboard</h3>
        <p className="mt-1 text-red-700">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 btn-primary"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white card">
          <div className="flex items-center">
            <div className="flex items-center justify-center p-3 bg-blue-100 rounded-lg">
              <FiFolder className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Projects</p>
              <p className="text-xl font-semibold text-gray-900">{stats.projects.total}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/projects" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              View all projects →
            </Link>
          </div>
        </div>

        <div className="bg-white card">
          <div className="flex items-center">
            <div className="flex items-center justify-center p-3 bg-green-100 rounded-lg">
              <FiUsers className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Clients</p>
              <p className="text-xl font-semibold text-gray-900">{stats.clients.total}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/clients" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              View all clients →
            </Link>
          </div>
        </div>

        <div className="bg-white card">
          <div className="flex items-center">
            <div className="flex items-center justify-center p-3 bg-purple-100 rounded-lg">
              <FiClock className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Hours This Month</p>
              <p className="text-xl font-semibold text-gray-900">{stats.time.total_hours?.toFixed(1) || 0}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/time" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              View time tracking →
            </Link>
          </div>
        </div>

        <div className="bg-white card">
          <div className="flex items-center">
            <div className="flex items-center justify-center p-3 rounded-lg bg-amber-100">
              <FiFileText className="w-6 h-6 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Payment</p>
              <p className="text-xl font-semibold text-gray-900">
                ${stats.invoices.pending_payment?.toFixed(2) || 0}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/invoices" className="text-sm font-medium text-primary-600 hover:text-primary-700">
              View invoices →
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white card">
          <h2 className="mb-4 text-lg font-medium text-gray-900">Projects by Status</h2>
          <div className="flex items-center justify-center h-64">
            {stats.projects.total > 0 ? (
              <Doughnut 
                data={projectChartData} 
                options={{
                  plugins: { legend: { position: 'bottom' } },
                  maintainAspectRatio: false,
                }}
              />
            ) : (
              <div className="text-center text-gray-500">
                <p>No projects yet</p>
                <Link 
                  to="/projects" 
                  className="inline-flex items-center mt-2 text-primary-600 hover:text-primary-700"
                >
                  <FiPlusCircle className="mr-1" />
                  Create your first project
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white card">
          <h2 className="mb-4 text-lg font-medium text-gray-900">Hours Worked (Last 7 Days)</h2>
          <div className="flex items-center justify-center h-64">
            {stats.time.hours_by_day?.length > 0 ? (
              <Line
                data={timeChartData}
                options={{
                  scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Hours' } },
                    x: { title: { display: true, text: 'Date' } },
                  },
                  plugins: { legend: { display: false } },
                  maintainAspectRatio: false,
                }}
              />
            ) : (
              <div className="text-center text-gray-500">
                <p>No time entries yet</p>
                <Link 
                  to="/time" 
                  className="inline-flex items-center mt-2 text-primary-600 hover:text-primary-700"
                >
                  <FiPlusCircle className="mr-1" />
                  Log your time
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Projects</h2>
            <Link 
              to="/projects" 
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View all
            </Link>
          </div>
          
          {stats.projects.recent_projects?.length > 0 ? (
            <div className="space-y-3">
              {stats.projects.recent_projects.map(project => (
                <Link 
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="block p-3 transition rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-3 ${
                        project.status === 'active' ? 'bg-blue-500' :
                        project.status === 'completed' ? 'bg-green-500' :
                        project.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <h3 className="font-medium text-gray-800">{project.title}</h3>
                        <p className="text-sm text-gray-500">
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">
                      {project.total_hours} hrs
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <p>No projects yet</p>
              <Link 
                to="/projects" 
                className="inline-flex items-center mt-2 text-primary-600 hover:text-primary-700"
              >
                <FiPlusCircle className="mr-1" />
                Create your first project
              </Link>
            </div>
          )}
        </div>

        <div className="bg-white card">
          <h2 className="mb-4 text-lg font-medium text-gray-900">Alerts & Reminders</h2>
          
          <div className="space-y-4">
            {stats.invoices.overdue_count > 0 && (
              <div className="flex items-start p-4 rounded-lg bg-red-50">
                <FiAlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-medium text-red-800">Overdue Invoices</h3>
                  <p className="mt-1 text-sm text-red-700">
                    You have {stats.invoices.overdue_count} overdue {stats.invoices.overdue_count === 1 ? 'invoice' : 'invoices'}.
                  </p>
                  <Link 
                    to="/invoices" 
                    className="inline-block mt-2 text-sm font-medium text-red-700 hover:text-red-800"
                  >
                    View invoices →
                  </Link>
                </div>
              </div>
            )}
            
            {stats.projects.by_status?.active > 0 && (
              <div className="flex items-start p-4 rounded-lg bg-blue-50">
                <FiTrendingUp className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-medium text-blue-800">Active Projects</h3>
                  <p className="mt-1 text-sm text-blue-700">
                    You have {stats.projects.by_status.active} active {stats.projects.by_status.active === 1 ? 'project' : 'projects'} in progress.
                  </p>
                  <Link 
                    to="/projects" 
                    className="inline-block mt-2 text-sm font-medium text-blue-700 hover:text-blue-800"
                  >
                    View projects →
                  </Link>
                </div>
              </div>
            )}
            
            {stats.time.billable_hours > 0 && (
              <div className="flex items-start p-4 rounded-lg bg-amber-50">
                <FiFileText className="h-5 w-5 text-amber-500 mt-0.5 mr-3" />
                <div>
                  <h3 className="font-medium text-amber-800">Unbilled Hours</h3>
                  <p className="mt-1 text-sm text-amber-700">
                    You have {stats.time.billable_hours.toFixed(1)} billable hours that haven&apos;t been invoiced.
                  </p>
                  <Link 
                    to="/invoices" 
                    className="inline-block mt-2 text-sm font-medium text-amber-700 hover:text-amber-800"
                  >
                    Create invoice →
                  </Link>
                </div>
              </div>
            )}
            
            {stats.invoices.overdue_count === 0 && 
             stats.projects.by_status?.active === 0 && 
             (!stats.time.billable_hours || stats.time.billable_hours === 0) && (
              <div className="flex items-center justify-center h-40 text-gray-500">
                <p>No alerts at this time</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;