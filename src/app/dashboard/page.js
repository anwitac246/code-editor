'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase-config';
import axios from 'axios';
import { FiLogOut, FiPlus, FiFolder, FiX, FiTrash2 } from 'react-icons/fi';

export default function Dashboard() {
  const [uid, setUid] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
  });
  const router = useRouter();

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
        const res = await axios.get(`http://localhost:5001/api/projects?uid=${uid}`);
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
      alert('Project name is required!');
      return;
    }

    if (!uid) {
      alert('User not authenticated. Please log in again.');
      return;
    }

    console.log('Creating project with UID:', uid);
    setCreateLoading(true);

    try {
      const res = await axios.post('http://localhost:5001/api/projects', {
        name: newProject.name.trim(),
        description: newProject.description.trim(),
        uid,
      });

      console.log('Project created:', res.data);
      setProjects((prev) => [res.data.project, ...prev]);
      setNewProject({ name: '', description: '' });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating project:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
      });
      alert('Failed to create project. Please try again.');
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
      alert('Cannot delete project: Missing project or user information');
      return;
    }
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(true);
    try {
      const response = await axios.delete(
        `http://localhost:5001/api/projects/${projectId}?uid=${uid}`
      );
      console.log(`Project deleted: projectId=${projectId}`, response.data);
      setProjects((prev) => prev.filter((p) => p.projectId !== projectId));
      alert('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
      });
      alert(`Failed to delete project: ${error.response?.data?.message || 'Unknown error'}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setNewProject({ name: '', description: '' });
  };

  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#0f172a] to-[#1e293b] text-white p-8 flex flex-col">
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
              <button
                onClick={() => handleDeleteProject(project.projectId)}
                className="absolute top-2 right-2 p-1 rounded-md hover:bg-red-600 transition"
                title="Delete project"
                disabled={loading || createLoading || deleteLoading}
              >
                <FiTrash2 size={18} />
              </button>
              <div
                onClick={() => openProject(project.projectId)}
                className={`cursor-pointer ${loading || createLoading || deleteLoading ? 'pointer-events-none opacity-50' : ''}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !loading && !createLoading && !deleteLoading) {
                    openProject(project.projectId);
                  }
                }}
                aria-label={`Open project ${project.name}`}
              >
                <div className="flex items-center mb-4 text-cyan-400">
                  <FiFolder size={28} />
                  <h2 className="ml-3 text-2xl font-semibold truncate">
                    {project.name || 'Untitled Project'}
                  </h2>
                </div>
                <p className="text-gray-300 line-clamp-3 min-h-[3rem]">
                  {project.description || 'No description provided.'}
                </p>
                <div className="mt-4 text-xs text-gray-500">
                  Created: {new Date(project.createdAt).toLocaleDateString()}
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