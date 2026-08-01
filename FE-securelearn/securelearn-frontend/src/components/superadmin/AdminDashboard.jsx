import React, { useState, useEffect } from 'react';
import { getTenants, createTenant, blockTenant, unblockTenant, deleteTenant } from '../../api/superAdminApi';
import { useAuth } from '../../hooks/useAuth';

const AdminDashboard = () => {
  const { logout } = useAuth();
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");
  
  const [newTenant, setNewTenant] = useState({ 
    name: '', 
    type: 'EDTECH_COMPANY',
    adminName: '',
    adminEmail: '',
    adminPassword: ''
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await getTenants();
      setTenants(res.data);
    } catch (err) {
      console.error("Failed to fetch tenants", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newTenant.name || !newTenant.adminEmail || !newTenant.adminPassword) return;
    setError("");
    
    try {
      await createTenant(newTenant);
      await fetchTenants(); // Refresh list
      setNewTenant({ name: '', type: 'EDTECH_COMPANY', adminName: '', adminEmail: '', adminPassword: '' });
      setIsAdding(false);
    } catch (err) {
      setError(err.response?.data || "Failed to create tenant");
      console.error(err);
    }
  };

  const toggleStatus = async (tenant) => {
    try {
      if (tenant.blocked) {
        await unblockTenant(tenant.id);
      } else {
        await blockTenant(tenant.id);
      }
      await fetchTenants();
    } catch (err) {
      console.error("Failed to toggle status", err);
    }
  };

  const handleDeleteTenant = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this tenant? This action cannot be undone.")) {
      try {
        await deleteTenant(id);
        await fetchTenants();
      } catch (err) {
        console.error("Failed to delete tenant", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10 w-full shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center text-white font-bold text-sm shadow-inner">
                SA
              </div>
              <span className="font-semibold text-gray-900 text-lg tracking-tight">System Orchestration</span>
            </div>
            <button 
              onClick={logout}
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Platform Tenants</h1>
            <p className="text-sm text-gray-500 mt-1">Manage all provisioned organizations and their super-admins.</p>
          </div>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="mt-4 sm:mt-0 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg shadow-md transition-all text-sm flex items-center hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Provision Tenant
          </button>
        </div>

        {isAdding && (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6 transition-all duration-300">
            <h3 className="font-semibold text-gray-900 mb-4">Provision New Tenant</h3>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Organization Name</label>
                  <input 
                    type="text" 
                    placeholder="E.g., Global University"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    value={newTenant.name}
                    onChange={(e) => setNewTenant({...newTenant, name: e.target.value})}
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tenant Type</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                    value={newTenant.type}
                    onChange={(e) => setNewTenant({...newTenant, type: e.target.value})}
                  >
                    <option value="EDTECH_COMPANY">EdTech Company</option>
                    <option value="SOLO_TUTOR">Solo Tutor</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Admin Account Initialization</h4>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <input 
                      type="text" 
                      placeholder="Admin Name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      value={newTenant.adminName}
                      onChange={(e) => setNewTenant({...newTenant, adminName: e.target.value})}
                    />
                  </div>
                  <div className="flex-1">
                    <input 
                      type="email" 
                      placeholder="Admin Email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      value={newTenant.adminEmail}
                      onChange={(e) => setNewTenant({...newTenant, adminEmail: e.target.value})}
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <input 
                      type="password" 
                      placeholder="Admin Password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      value={newTenant.adminPassword}
                      onChange={(e) => setNewTenant({...newTenant, adminPassword: e.target.value})}
                      required
                      minLength={6}
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button type="submit" className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-colors shadow-sm">Provision Tenant</button>
                <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tenant Name</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Created</th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                    <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">Loading...</td>
                    </tr>
                ) : tenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center font-bold border border-purple-100">
                          {tenant.name.charAt(0)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                          <div className="text-xs text-gray-500 uppercase tracking-wide">ID: {tenant.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                      {tenant.type.replace('_', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        !tenant.blocked ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
                      }`}>
                        {!tenant.blocked ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                      <button 
                        onClick={() => toggleStatus(tenant)}
                        className={`${!tenant.blocked ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'} transition-colors font-semibold`}
                      >
                        {!tenant.blocked ? 'Suspend' : 'Unsuspend'}
                      </button>
                      <button 
                        onClick={() => handleDeleteTenant(tenant.id)}
                        className="text-red-600 hover:text-red-900 transition-colors font-semibold"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                
                {!loading && tenants.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex justify-center mb-3">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                      </div>
                      <p className="text-gray-500">No tenants found. Provision your first organization to get started.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
