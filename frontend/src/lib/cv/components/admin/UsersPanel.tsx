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
    const [users] = useState<User[]>(DEMO_USERS);

    return (
        <div className="panel-content">
            <div className="panel-header">
                <h2>Gestion des Utilisateurs</h2>
                <p className="panel-subtitle">
                    {users.length} utilisateur(s) enregistré(s)
                </p>
            </div>

            <div className="panel-controls">
                <button className="btn-primary">+ Ajouter un utilisateur</button>
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Rechercher un utilisateur..."
                        className="search-input"
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
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className="user-name">{user.name}</td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={`role-badge role-${user.role}`}>
                                        {user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                                    </span>
                                </td>
                                <td>{new Date(user.joinDate).toLocaleDateString('fr-FR')}</td>
                                <td className="actions-cell">
                                    <button className="btn-small btn-edit" title="Modifier">
                                        ✎
                                    </button>
                                    <button className="btn-small btn-delete" title="Supprimer">
                                        ✕
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
