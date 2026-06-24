import { useState, useEffect } from 'react';
import './panels.css';

interface ApiUser {
    id: number;
    username: string;
    email: string;
    role_id: number;
    created_at: string;
    role: { id: number; name: string };
}

const API_BASE = 'http://127.0.0.1:8000';

const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('access_token') ?? ''}`,
});

export function UsersPanel() {
    const [users, setUsers] = useState<ApiUser[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_BASE}/users`, { headers: getAuthHeaders() });
                if (!res.ok) throw new Error(`Erreur ${res.status}`);
                const data = await res.json();
                setUsers(data);
            } catch (err) {
                setError('Impossible de charger les utilisateurs.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const filteredUsers = users.filter(
        (u) =>
            u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="panel-content">
            <div className="panel-header">
                <h2>Gestion des Utilisateurs</h2>
                <p className="panel-subtitle">
                    {filteredUsers.length} utilisateur(s) {searchQuery ? 'trouvé(s)' : 'enregistré(s)'}
                </p>
            </div>

            <div className="panel-controls">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Rechercher un utilisateur..."
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {loading && <p className="panel-feedback">Chargement...</p>}
            {error && <p className="panel-feedback panel-error">{error}</p>}

            {!loading && !error && (
                <div className="panel-table-wrapper" tabIndex={0} role="region" aria-label="Tableau des utilisateurs">
                    <table className="panel-table">
                        <thead>
                            <tr>
                                <th scope="col">Nom</th>
                                <th scope="col">Email</th>
                                <th scope="col">Rôle</th>
                                <th scope="col">Date d'inscription</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td className="user-name">{user.username}</td>
                                    <td>{user.email}</td>
                                    <td>
                                        <span className={`role-badge role-${user.role.name}`}>
                                            {user.role.name === 'admin' ? 'Administrateur' : 'Utilisateur'}
                                        </span>
                                    </td>
                                    <td>{new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}