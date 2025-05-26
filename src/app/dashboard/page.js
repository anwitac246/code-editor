'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase-config';
import axios from 'axios';
import { FiLogOut, FiPlus, FiFolder, FiX, FiTrash2, FiDownload, FiAlertCircle } from 'react-icons/fi';

export default function Dashboard() {
  const [uid, setUid] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState({});
  const [downloadProgress, setDownloadProgress] = useState({});
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const router = useRouter();

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Auth state changed:', user ? `User logged in: ${user.uid}` : 'No user');
      if (user) {
        console.log('Firebase UID:', user.uid);
        console.log('User email:', user.email);
        setUid(user.uid);
      } else {
        console.log('No user found, redirecting to login');
        setUid(null);
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (!uid) {
      console.log('No UID available yet');
      return;
    }

    console.log('Fetching projects for UID:', uid);

    const fetchProjects = async () => {
      try {
        const res = await axios.get(`/api/projects?uid=${uid}`);
        console.log('Projects response:', res.data);
        setProjects(res.data.projects || []);
      } catch (e) {
        console.error('Error loading projects:', e);
        console.error('Error details:', {
          status: e.response?.status,
          statusText: e.response?.statusText,
          data: e.response?.data,
          url: e.config?.url,
        });

        if (e.response?.status === 404) {
          console.log('No projects found');
        }
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [uid]);

  const openProject = (projectId) => {
    if (loading || createLoading || deleteLoading) {
      console.log('Project click ignored: Dashboard is loading');
      return;
    }
    console.log(`Opening project: projectId=${projectId}`);
    router.push(`/?projectId=${projectId}`);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log('User logged out');
      router.push('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleNewProject = () => {
    if (loading || deleteLoading) {
      console.log('New project click ignored: Dashboard is loading');
      return;
    }
    setShowCreateModal(true);
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();

    if (!newProject.name.trim()) {
      showNotification('Project name is required!', 'error');
      return;
    }

    if (!uid) {
      showNotification('User not authenticated. Please log in again.', 'error');
      return;
    }

    console.log('Creating project with UID:', uid);
    setCreateLoading(true);

    try {
      const res = await axios.post('/api/projects/index.js', {
        name: newProject.name.trim(),
        description: newProject.description.trim(),
        uid,
      });

      console.log('Project created:', res.data);
      setProjects((prev) => [res.data.project, ...prev]);
      setNewProject({ name: '', description: '' });
      setShowCreateModal(false);
      showNotification('Project created successfully!', 'success');
    } catch (error) {
      console.error('Error creating project:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
      });
      showNotification('Failed to create project. Please try again.', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (loading || createLoading || deleteLoading) {
      console.log('Delete project click ignored: Dashboard is loading');
      return;
    }
    if (!projectId || !uid) {
      console.error('Missing projectId or uid:', { projectId, uid });
      showNotification('Cannot delete project: Missing project or user information', 'error');
      return;
    }
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await axios.delete(
        `/api/projects/${projectId}?uid=${uid}`
      );
      console.log(`Project deleted: projectId=${projectId}`, response.data);
      setProjects((prev) => prev.filter((p) => p.projectId !== projectId));
      showNotification('Project deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting project:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
      });
      showNotification(`Failed to delete project: ${error.response?.data?.message || 'Unknown error'}`, 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDownloadProject = async (projectId, projectName) => {
  if (loading || createLoading || deleteLoading || downloadLoading[projectId]) {
    console.log('Download project click ignored: Dashboard is loading');
    return;
  }

  if (!projectId || !uid) {
    console.error('Missing projectId or uid:', { projectId, uid });
    showNotification('Cannot download project: Missing project or user information', 'error');
    return;
  }

  console.log(`=== DOWNLOAD DEBUG START ===`);
  console.log(`Project ID: ${projectId}`);
  console.log(`Project Name: ${projectName}`);
  console.log(`User ID: ${uid}`);
  console.log(`Download URL: /api/projects/${projectId}/download?uid=${uid}`);
  
  setDownloadLoading(prev => ({ ...prev, [projectId]: true }));
  setDownloadProgress(prev => ({ ...prev, [projectId]: 0 }));

  try {

    setDownloadProgress(prev => ({ ...prev, [projectId]: 25 }));
    
    console.log('Making download request...');
    
    const response = await axios.get(
      `/api/projects/${projectId}/download?uid=${uid}`,
      {
        responseType: 'blob',
        onDownloadProgress: (progressEvent) => {
          console.log('Download progress:', progressEvent);
          if (progressEvent.lengthComputed) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            console.log(`Download progress: ${percentCompleted}%`);
            setDownloadProgress(prev => ({ ...prev, [projectId]: Math.max(25, percentCompleted) }));
          }
        },
        timeout: 30000,
      }
    );

    console.log('Response received:', {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      dataSize: response.data?.size || 'unknown'
    });

    setDownloadProgress(prev => ({ ...prev, [projectId]: 90 }));

    if (!response.data || response.data.size === 0) {
      console.error('Empty response data:', response.data);
      throw new Error('Received empty file from server');
    }

    console.log('Creating blob and download link...');

    const blob = new Blob([response.data], { type: 'application/zip' });
    console.log('Blob created:', { size: blob.size, type: blob.type });
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const sanitizedProjectName = projectName.replace(/[^\w\s-]/g, '').replace(/\s+/g, '_');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '_');
    const filename = `${sanitizedProjectName}_${timestamp}.zip`;
    link.download = filename;
    
    console.log('Download filename:', filename);
    
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);

    setDownloadProgress(prev => ({ ...prev, [projectId]: 100 }));
    
    console.log(`Project downloaded successfully: ${projectName} (${blob.size} bytes)`);
    console.log(`=== DOWNLOAD DEBUG END ===`);
    showNotification(`Project "${projectName}" downloaded successfully!`, 'success');
    
  } catch (error) {
    console.log(`=== DOWNLOAD ERROR DEBUG START ===`);
    console.error('Error downloading project:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      timeout: error.code === 'ECONNABORTED',
      name: error.name,
      code: error.code
    });
    

    if (error.response?.data) {
      console.log('Error response data type:', typeof error.response.data);
      console.log('Error response data:', error.response.data);
      
      if (error.response.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text();
          console.log('Error response as text:', errorText);
        } catch (blobError) {
          console.log('Could not read error response blob:', blobError);
        }
      }
    }
    console.log(`=== DOWNLOAD ERROR DEBUG END ===`);
    
    let errorMessage = 'Failed to download project. Please try again.';
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'Download timed out. The project might be too large or the server is busy.';
    } else if (error.response?.status === 404) {
      errorMessage = 'Project not found or no files to download.';
    } else if (error.response?.status === 403) {
      errorMessage = 'You do not have permission to download this project.';
    } else if (error.response?.status === 500) {
      errorMessage = 'Server error while creating download. Please try again later.';
    } else if (error.message === 'Received empty file from server') {
      errorMessage = 'The project appears to be empty or corrupted.';
    }
    
    showNotification(errorMessage, 'error');
  } finally {
    setDownloadLoading(prev => ({ ...prev, [projectId]: false }));
    
    setTimeout(() => {
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[projectId];
        return newProgress;
      });
    }, 2000);
  }
};

  const closeModal = () => {
    setShowCreateModal(false);
    setNewProject({ name: '', description: '' });
  };

  return (
    
    <div className="min-h-screen bg-gradient-to-tr from-[#0f172a] to-[#1e293b] text-white p-8 flex flex-col relative">
     
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-3 max-w-md ${
          notification.type === 'success' ? 'bg-green-600' : 
          notification.type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        }`}>
          <FiAlertCircle size={20} />
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <header className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-extrabold tracking-wide select-none">My Projects</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={handleNewProject}
            className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 transition rounded-md px-4 py-2 text-sm font-semibold shadow-lg shadow-cyan-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Create new project"
            disabled={loading || createLoading || deleteLoading}
          >
            <FiPlus size={18} /> New Project
          </button>
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-2 rounded-md hover:bg-red-600 transition"
            disabled={loading || createLoading || deleteLoading}
          >
            <FiLogOut size={22} />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="text-center text-gray-400 mt-20 text-lg font-medium animate-pulse">
          Loading projects...
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center text-gray-400 mt-20 text-lg font-medium">
          No projects found. Click "New Project" to get started!
        </div>
      ) : (
        <main className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 flex-grow overflow-auto">
          {projects.map((project) => (
            <div
              key={project._id}
              className="relative bg-[#152238] rounded-xl p-6 shadow-xl shadow-black/60 hover:shadow-cyan-600/80 transition transform hover:-translate-y-1"
            >
              {/* Action buttons in top-right corner */}
              <div className="absolute top-2 right-2 flex gap-1">
                <button
                  onClick={() => handleDownloadProject(project.projectId, project.name)}
                  className="p-1 rounded-md hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed relative group"
                  title="Download project as ZIP"
                  disabled={loading || createLoading || deleteLoading || downloadLoading[project.projectId]}
                >
                  {downloadLoading[project.projectId] ? (
                    <div className="relative">
                      <div className="w-[18px] h-[18px] border-2 border-green-400 border-t-transparent rounded-full animate-spin"></div>
                      {downloadProgress[project.projectId] && (
                        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-xs px-2 py-1 rounded whitespace-nowrap">
                          {downloadProgress[project.projectId]}%
                        </div>
                      )}
                    </div>
                  ) : (
                    <FiDownload size={18} />
                  )}
                  {/* Enhanced tooltip */}
                  <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-90 text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Download as ZIP
                  </div>
                </button>
                <button
                  onClick={() => handleDeleteProject(project.projectId)}
                  className="p-1 rounded-md hover:bg-red-600 transition group"
                  title="Delete project"
                  disabled={loading || createLoading || deleteLoading || downloadLoading[project.projectId]}
                >
                  <FiTrash2 size={18} />
                  {/* Enhanced tooltip */}
                  <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-90 text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    Delete project
                  </div>
                </button>
              </div>

              <div
                onClick={() => openProject(project.projectId)}
                className={`cursor-pointer ${loading || createLoading || deleteLoading || downloadLoading[project.projectId] ? 'pointer-events-none opacity-50' : ''}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading && !createLoading && !deleteLoading && !downloadLoading[project.projectId]) {
                    openProject(project.projectId);
                  }
                }}
                aria-label={`Open project ${project.name}`}
              >
                <div className="flex items-center mb-4 text-cyan-400">
                  <FiFolder size={28} />
                  <h2 className="ml-3 text-2xl font-semibold truncate pr-16">
                    {project.name || 'Untitled Project'}
                  </h2>
                </div>
                <p className="text-gray-300 line-clamp-3 min-h-[3rem]">
                  {project.description || 'No description provided.'}
                </p>
                <div className="mt-4 text-xs text-gray-500 space-y-1">
                  <div>Created: {new Date(project.createdAt).toLocaleDateString()}</div>
                  {project.updatedAt !== project.createdAt && (
                    <div>Updated: {new Date(project.updatedAt).toLocaleDateString()}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </main>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#152238] rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-cyan-400">Create New Project</h2>
              <button
                onClick={closeModal}
                className="p-1 hover:bg-gray-700 rounded-md transition"
                disabled={createLoading || deleteLoading}
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-gray-300 mb-2">
                  Project Name *
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#0f172a] border border-gray-600 rounded-md text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  placeholder="Enter project name"
                  required
                  disabled={createLoading || deleteLoading}
                />
              </div>

              <div>
                <label
                  htmlFor="projectDescription"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Description (optional)
                </label>
                <textarea
                  id="projectDescription"
                  value={newProject.description}
                  onChange={(e) =>
                    setNewProject((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-[#0f172a] border border-gray-600 rounded-md text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none"
                  placeholder="Enter project description"
                  rows={3}
                  disabled={createLoading || deleteLoading}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md transition font-medium"
                  disabled={createLoading || deleteLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-md transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={createLoading || deleteLoading}
                >
                  {createLoading ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}