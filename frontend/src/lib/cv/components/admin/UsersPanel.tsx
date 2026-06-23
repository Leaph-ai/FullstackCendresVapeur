import { useState } from 'react';
import './panels.css';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user';
    joinDate: string;
}

const DEMO_USERS: User[] = [
    {
        id: 1,
        name: 'Administrateur Principal',
        email: 'admin@cendresveapeur.fr',
        role: 'admin',
        joinDate: '2024-01-15',
    },
    {
        id: 2,
        name: 'Jean Dupont',
        email: 'jean.dupont@email.com',
        role: 'user',
        joinDate: '2024-03-20',
    },
    {
        id: 3,
        name: 'Marie Martin',
        email: 'marie.martin@email.com',
        role: 'user',
        joinDate: '2024-05-10',
    },
    {
        id: 4,
        name: 'Pierre Lefevre',
        email: 'pierre.lefevre@email.com',
        role: 'user',
        joinDate: '2024-06-01',
    },
];

export function UsersPanel() {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredUsers = DEMO_USERS.filter(
        (user) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
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

            <div className="panel-table-wrapper">
                <table className="panel-table">
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Email</th>
                            <th>Rôle</th>
                            <th>Date d'inscription</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
                            <tr key={user.id}>
                                <td className="user-name">{user.name}</td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={`role-badge role-${user.role}`}>
                                        {user.role === 'admin'
                                            ? 'Administrateur'
                                            : 'Utilisateur'}
                                    </span>
                                </td>
                                <td>
                                    {new Date(user.joinDate).toLocaleDateString('fr-FR')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
