import { useState } from 'react';
import './panels.css';

interface Product {
    id: number;
    name: string;
    category: string;
    price: number;
    stock: number;
    status: 'active' | 'inactive';
}

const DEMO_PRODUCTS: Product[] = [
    {
        id: 1,
        name: 'Régulateur de pression Mk.III',
        category: 'Mécanique lourde',
        price: 48,
        stock: 12,
        status: 'active',
    },
    {
        id: 2,
        name: 'Valve d\'appoint laiton',
        category: 'Vapeur',
        price: 31,
        stock: 8,
        status: 'active',
    },
    {
        id: 3,
        name: 'Lentille optique cuivrée',
        category: 'Optique',
        price: 76,
        stock: 5,
        status: 'active',
    },
    {
        id: 4,
        name: 'Manomètre de quart',
        category: 'Mesure',
        price: 22,
        stock: 0,
        status: 'inactive',
    },
    {
        id: 5,
        name: 'Détendeur à soupape',
        category: 'Mécanique',
        price: 54,
        stock: 15,
        status: 'active',
    },
];

export function ProductsPanel() {
    const [products] = useState<Product[]>(DEMO_PRODUCTS);

    return (
        <div className="panel-content">
            <div className="panel-header">
                <h2>Gestion des Produits</h2>
                <p className="panel-subtitle">
                    {products.filter((p) => p.status === 'active').length} produit(s) actif(s)
                </p>
            </div>

            <div className="panel-controls">
                <button className="btn-primary">+ Ajouter un produit</button>
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Rechercher un produit..."
                        className="search-input"
                    />
                </div>
            </div>

            <div className="panel-table-wrapper">
                <table className="panel-table">
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Catégorie</th>
                            <th>Prix (ⵟ)</th>
                            <th>Stock</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product.id}>
                                <td className="product-name">{product.name}</td>
                                <td>{product.category}</td>
                                <td className="price-cell">{product.price}</td>
                                <td>
                                    <span className={`stock-indicator ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                                        {product.stock > 0 ? `${product.stock} unités` : 'Rupture'}
                                    </span>
                                </td>
                                <td>
                                    <span
                                        className={`status-badge status-${product.status}`}
                                    >
                                        {product.status === 'active' ? 'Actif' : 'Inactif'}
                                    </span>
                                </td>
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
