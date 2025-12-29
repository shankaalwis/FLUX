'use client'

import { useEffect, useState } from 'react'
import { PlusCircle, Upload, TrendingUp, DollarSign } from 'lucide-react'

interface BankProfile {
    id: string
    bank_name: string
    parser_type: string
    transaction_count: number
    earliest_transaction: string | null
    latest_transaction: string | null
}

export default function DashboardPage() {
    const [profiles, setProfiles] = useState<BankProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [bankName, setBankName] = useState('')
    const [creating, setCreating] = useState(false)

    useEffect(() => {
        fetchProfiles()
    }, [])

    const fetchProfiles = async () => {
        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const token = localStorage.getItem('access_token')

            const response = await fetch(`${API_URL}/api/profiles`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const data = await response.json()
                setProfiles(data)
            }
        } catch (error) {
            console.error('Error fetching profiles:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setCreating(true)

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
            const token = localStorage.getItem('access_token')

            const response = await fetch(`${API_URL}/api/profiles`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    bank_name: bankName,
                    parser_type: 'generic',
                }),
            })

            if (response.ok) {
                setBankName('')
                setShowCreateModal(false)
                fetchProfiles()
            }
        } catch (error) {
            console.error('Error creating profile:', error)
        } finally {
            setCreating(false)
        }
    }

    if (loading) {
        return <div className="text-center py-12">Loading...</div>
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
                    <p className="text-gray-600 mt-1">Manage your bank profiles and analyze statements</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    <PlusCircle size={20} />
                    Add Bank Profile
                </button>
            </div>

            {profiles.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <Upload size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No bank profiles yet</h3>
                    <p className="text-gray-600 mb-4">Create your first bank profile to get started</p>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        Create Bank Profile
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {profiles.map((profile) => (
                        <div key={profile.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{profile.bank_name}</h3>
                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <TrendingUp size={16} />
                                    <span>{profile.transaction_count} transactions</span>
                                </div>
                                {profile.earliest_transaction && profile.latest_transaction && (
                                    <div className="flex items-center gap-2">
                                        <DollarSign size={16} />
                                        <span>
                                            {new Date(profile.earliest_transaction).toLocaleDateString()} - {new Date(profile.latest_transaction).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 pt-4 border-t flex gap-2">
                                <button className="flex-1 bg-blue-50 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-100 transition text-sm font-medium">
                                    Upload Statement
                                </button>
                                <button className="flex-1 bg-gray-50 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition text-sm font-medium">
                                    View Transactions
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Create Bank Profile</h3>
                        <form onSubmit={handleCreateProfile}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Bank Name
                                </label>
                                <input
                                    type="text"
                                    value={bankName}
                                    onChange={(e) => setBankName(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., Chase Checking"
                                    required
                                />
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={creating}
                                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                                >
                                    {creating ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
