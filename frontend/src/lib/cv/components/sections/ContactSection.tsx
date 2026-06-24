import { useState } from 'react';
import { PanelBody, PanelHead, ScrollPanel } from '../primitives/ScrollPanel';

interface ContactSectionProps {
    locked?: boolean;
    clanking?: boolean;
}

interface FormState {
    nom: string;
    email: string;
    sujet: string;
    message: string;
}

const SUJETS = [
    'Demande de troc',
    'Signalement sectoriel',
    'Transmission chiffrée',
    'Rapport de pression',
    'Autre missive',
];

export function ContactSection({ locked = false, clanking = false }: ContactSectionProps) {
    const [form, setForm] = useState<FormState>({
        nom: '',
        email: '',
        sujet: '',
        message: '',
    });
    const [submitted, setSubmitted] = useState(false);
    const [errors, setErrors] = useState<Partial<FormState>>({});

    function validate(): boolean {
        const next: Partial<FormState> = {};
        if (!form.nom.trim()) next.nom = 'Identifiant requis';
        if (!form.email.trim()) {
            next.email = 'Adresse requise';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            next.email = 'Format invalide';
        }
        if (!form.sujet) next.sujet = 'Sélectionner un objet';
        if (!form.message.trim()) next.message = 'Missive vide';
        setErrors(next);
        return Object.keys(next).length === 0;
    }

    function handleChange(
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
        if (errors[name as keyof FormState]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;
        // TODO: connecter à POST /contact une fois le backend Pourpre prêt
        setSubmitted(true);
    }

    function handleReset() {
        setForm({ nom: '', email: '', sujet: '', message: '' });
        setErrors({});
        setSubmitted(false);
    }

    return (
        <ScrollPanel id="contact" locked={locked} clanking={clanking}>
            <PanelHead
                sector="BUREAU DE POSTE"
                title="Missives & transmissions"
                right={
                    <span className="cv-badge">
                        <span className="led" />● ligne ouverte
                    </span>
                }
            />
            <PanelBody>
                <div className="contact-wrap">
                    {submitted ? (
                        <div className="contact-confirm" role="status" aria-live="polite">
                            <p className="hero-line">
                                &gt; TRANSMISSION REÇUE &nbsp;··········&nbsp;{' '}
                                <span className="ok">EN ATTENTE DE RÉPONSE</span>
                            </p>
                            <p className="contact-confirm-msg">
                                Votre missive a été acheminée au bureau de poste de la zone franche.
                                <br />
                                Un émissaire vous répondra dans les plus brefs délais, citoyen.
                            </p>
                            <button type="button" className="cv-btn is-ghost" onClick={handleReset}>
                                Envoyer une nouvelle missive
                            </button>
                        </div>
                    ) : (
                        <form
                            className="contact-form"
                            onSubmit={handleSubmit}
                            noValidate
                            aria-label="Formulaire de contact"
                        >
                            <div className="contact-row">
                                {/* Identifiant */}
                                <div className={`cv-field${errors.nom ? ' is-error' : ''}`}>
                                    <label htmlFor="contact-nom" className="cv-label">
                                        Identifiant citoyen
                                    </label>
                                    <input
                                        id="contact-nom"
                                        name="nom"
                                        type="text"
                                        className="cv-control"
                                        placeholder="Ex. : Cobalt-114"
                                        value={form.nom}
                                        onChange={handleChange}
                                        autoComplete="name"
                                        aria-required="true"
                                        aria-describedby={errors.nom ? 'err-nom' : undefined}
                                    />
                                    {errors.nom && (
                                        <span id="err-nom" className="cv-hint" role="alert">
                                            {errors.nom}
                                        </span>
                                    )}
                                </div>

                                {/* Email */}
                                <div className={`cv-field${errors.email ? ' is-error' : ''}`}>
                                    <label htmlFor="contact-email" className="cv-label">
                                        Adresse de transmission
                                    </label>
                                    <input
                                        id="contact-email"
                                        name="email"
                                        type="email"
                                        className="cv-control"
                                        placeholder="citoyen@zone-franche.local"
                                        value={form.email}
                                        onChange={handleChange}
                                        autoComplete="email"
                                        aria-required="true"
                                        aria-describedby={errors.email ? 'err-email' : undefined}
                                    />
                                    {errors.email && (
                                        <span id="err-email" className="cv-hint" role="alert">
                                            {errors.email}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Sujet */}
                            <div className={`cv-field${errors.sujet ? ' is-error' : ''}`}>
                                <label htmlFor="contact-sujet" className="cv-label">
                                    Objet de la missive
                                </label>
                                <select
                                    id="contact-sujet"
                                    name="sujet"
                                    className="cv-control"
                                    value={form.sujet}
                                    onChange={handleChange}
                                    aria-required="true"
                                    aria-describedby={errors.sujet ? 'err-sujet' : undefined}
                                >
                                    <option value="">— Sélectionner un canal —</option>
                                    {SUJETS.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                                {errors.sujet && (
                                    <span id="err-sujet" className="cv-hint" role="alert">
                                        {errors.sujet}
                                    </span>
                                )}
                            </div>

                            {/* Message */}
                            <div className={`cv-field${errors.message ? ' is-error' : ''}`}>
                                <label htmlFor="contact-message" className="cv-label">
                                    Corps du message
                                </label>
                                <textarea
                                    id="contact-message"
                                    name="message"
                                    className="cv-control"
                                    placeholder="Rédigez votre transmission ici, citoyen…"
                                    rows={5}
                                    value={form.message}
                                    onChange={handleChange}
                                    aria-required="true"
                                    aria-describedby={errors.message ? 'err-message' : undefined}
                                />
                                {errors.message && (
                                    <span id="err-message" className="cv-hint" role="alert">
                                        {errors.message}
                                    </span>
                                )}
                            </div>

                            <div className="contact-actions">
                                <button type="submit" className="cv-btn" aria-label="Envoyer la missive">
                                    ► Envoyer la transmission
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </PanelBody>
        </ScrollPanel>
    );
}
