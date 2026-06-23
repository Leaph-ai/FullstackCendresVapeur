import { useState } from 'react';
import './panels.css';

interface User {
    id: number;
    name: string;
    email: string;
    role: 'admin' | 'user';
    joinDate: string;
}

type UserFormData = Pick<User, 'name' | 'email' | 'role'>;

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
    const [users, setUsers] = useState<User[]>(DEMO_USERS);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<UserFormData>({ name: '', email: '', role: 'user' });

    const filteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddUser = () => {
        setEditingUser(null);
        setFormData({ name: '', email: '', role: 'user' });
        setShowModal(true);
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setFormData({ name: user.name, email: user.email, role: user.role });
        setShowModal(true);
    };

    const handleDeleteUser = (id: number) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            setUsers(users.filter((u) => u.id !== id));
        }
    };

    const handleSaveUser = () => {
        if (!formData.name || !formData.email) {
            alert('Veuillez remplir tous les champs');
            return;
        }

        if (editingUser) {
            setUsers(
                users.map((u) =>
                    u.id === editingUser.id
                        ? {
                            ...u,
                            name: formData.name,
                            email: formData.email,
                            role: formData.role,
                        }
                        : u
                )
            );
        } else {
            const newUser: User = {
                id: Math.max(...users.map((u) => u.id), 0) + 1,
                name: formData.name,
                email: formData.email,
                role: formData.role,
                joinDate: new Date().toISOString().split('T')[0],
            };
            setUsers([...users, newUser]);
        }
        setShowModal(false);
    };

    return (
        <div className="panel-content">
            <div className="panel-header">
                <h2>Gestion des Utilisateurs</h2>
                <p className="panel-subtitle">
                    {filteredUsers.length} utilisateur(s) {searchQuery ? 'trouvé(s)' : 'enregistré(s)'}
                </p>
            </div>

            <div className="panel-controls">
                <button className="btn-primary" onClick={handleAddUser}>+ Ajouter un utilisateur</button>
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
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map((user) => (
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
                                    <button
                                        className="btn-small btn-edit"
                                        title="Modifier"
                                        onClick={() => handleEditUser(user)}
                                    >
                                        ✎
                                    </button>
                                    <button
                                        className="btn-small btn-delete"
                                        title="Supprimer"
                                        onClick={() => handleDeleteUser(user.id)}
                                    >
                                        ✕
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingUser ? 'Modifier un utilisateur' : 'Ajouter un utilisateur'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Nom</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Rôle</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            role: e.target.value as 'admin' | 'user',
                                        })
                                    }
                                    className="form-input"
                                >
                                    <option value="user">Utilisateur</option>
                                    <option value="admin">Administrateur</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowModal(false)}>
                                Annuler
                            </button>
                            <button className="btn-save" onClick={handleSaveUser}>
                                {editingUser ? 'Modifier' : 'Ajouter'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
