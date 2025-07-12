import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { getAppConfig } from "@/lib/supabaseServices";

const TombolaRulesPage = () => {
    const [contactEmail, setContactEmail] = useState("");
    const [contactPhone, setContactPhone] = useState("");

    useEffect(() => {
        async function fetchConfig() {
            const { data, error } = await getAppConfig();
            if (data) {
                setContactEmail(data.contact_email || "");
                setContactPhone(data.contact_phone || "");
            }
        }
        fetchConfig();
    }, []);

    return (
        <div className="min-h-screen bg-[#0B0B0F] text-white">
            <Navigation />
            <div className="max-w-3xl mx-auto px-4 py-8 text-gray-200 bg-[#1C1C21]/70 border border-gray-800 rounded-2xl shadow-lg mt-8 mb-8">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                    <span role="img" aria-label="ticket">🎟️</span> Tombolas – Règlement & Transparence
                </h1>
                <p className="text-sm text-gray-500 mb-6">📍 Par Centi Crescendo</p>

                {/* À propos */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-2">🔹 À propos de Centi Crescendo</h2>
                    <p className="mb-2">
                        Centi Crescendo est un projet porté par des jeunes passionnés de numérique, éducation et innovation sociale.
                        À travers nos tombolas, nous visons à :
                    </p>
                    <ul className="list-disc pl-6 mb-2">
                        <li>Soutenir le financement de nos serveurs et outils technologiques</li>
                        <li>Promouvoir la culture numérique auprès de la jeunesse</li>
                        <li>Récompenser nos communautés de manière ludique et équitable</li>
                    </ul>
                    <p>
                        Nos tombolas sont toujours pensées avec transparence, intégrité et impact social.
                    </p>
                </section>

                {/* Fonctionnement général */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-2">🔹 Fonctionnement général des tombolas</h2>
                    <p className="mb-2">Chaque tombola peut avoir des règles spécifiques, mais elles suivent toutes les principes ci-dessous :</p>
                    <div className="overflow-x-auto mb-2">
                        <table className="min-w-full border text-sm">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border px-2 py-1 text-left text-black">Élément</th>
                                    <th className="border px-2 py-1 text-left text-black">Détails</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td className="border px-2 py-1">Participation</td>
                                    <td className="border px-2 py-1">Accessible à tout public (sauf mention contraire)</td>
                                </tr>
                                <tr>
                                    <td className="border px-2 py-1">Prix des tickets</td>
                                    <td className="border px-2 py-1">Généralement entre 100 FCFA et 500 FCFA, selon la campagne</td>
                                </tr>
                                <tr>
                                    <td className="border px-2 py-1">Tirage au sort</td>
                                    <td className="border px-2 py-1">Réalisé publiquement ou en live numérique (Instagram, TikTok, etc.)</td>
                                </tr>
                                <tr>
                                    <td className="border px-2 py-1">Enregistrement</td>
                                    <td className="border px-2 py-1">Chaque ticket acheté reçoit un numéro unique et est traçable</td>
                                </tr>
                                <tr>
                                    <td className="border px-2 py-1">Lots</td>
                                    <td className="border px-2 py-1">Toujours définis à l’avance et affichés sur la page de chaque tombola</td>
                                </tr>
                                <tr>
                                    <td className="border px-2 py-1">Utilisation des fonds</td>
                                    <td className="border px-2 py-1">Maintenance de serveurs, achat de matériel, projets éducatifs numériques</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Fonctionnement des coupons */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-2">🔹 Fonctionnement du système de coupons</h2>
                    <ul className="list-disc pl-6 mb-2">
                        <li>Chaque utilisateur peut obtenir un coupon de réduction en parrainant ou via des campagnes spéciales.</li>
                        <li>Le coupon donne droit à une réduction immédiate sur le prix du ticket lors de l'achat.</li>
                        <li>Le code coupon est à renseigner lors de la participation à une tombola.</li>
                        <li>Le parrain (créateur du coupon) reçoit une commission sur chaque ticket acheté avec son code.</li>
                        <li>Plus vous partagez votre code, plus vous pouvez cumuler des commissions !</li>
                        <li>Les coupons sont nominatifs et traçables pour garantir la transparence.</li>
                    </ul>
                    <div className="bg-yellow-100/60 border-l-4 border-yellow-400 p-4 rounded text-yellow-900 text-sm">
                        Exemple :<br />
                        <span className="font-semibold">Vous partagez votre code coupon à un ami. Il achète un ticket avec ce code&nbsp;: il bénéficie d'une réduction, et vous touchez une commission sur son achat.</span>
                    </div>
                </section>

                {/* Engagement de transparence */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-2">🔹 Engagement de transparence</h2>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>✅ Chaque tombola a son règlement publié</li>
                        <li>✅ Les participants sont listés dans une base consultable sur demande</li>
                        <li>✅ Les tirages sont enregistrés ou diffusés en direct</li>
                        <li>✅ Les bénéfices sont réinvestis à 100% dans nos projets communautaires</li>
                    </ul>
                </section>

                {/* Règlement global */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-2">🔹 Règlement global (extraits)</h2>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Les billets sont nominatifs (ou associés à un numéro WhatsApp ou mail)</li>
                        <li>Aucun lot ne peut être échangé contre de l'argent</li>
                        <li>Aucune participation n’est prise en compte sans paiement validé</li>
                        <li>Chaque tombola a sa propre date de tirage et ses propres lots</li>
                        <li>Centi Crescendo se réserve le droit d’annuler une tombola en cas de force majeure, avec remboursement ou report.</li>
                    </ul>
                </section>

                {/* Historique des tombolas passées */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-2">🔹 Historique des tombolas passées</h2>
                    <Link to="/historique" className="inline-block px-4 py-2 bg-yellow-400 text-black font-semibold rounded-lg shadow hover:bg-yellow-500 transition-colors">Voir l'historique</Link>
                </section>

                {/* Contact & Support */}
                <section className="mb-8">
                    <h2 className="text-xl font-semibold mb-2">🔹 Contact & Support</h2>
                    <ul className="space-y-1">
                        <li>
                            📱 WhatsApp : {contactPhone ? (
                                <a href={`https://wa.me/${contactPhone.replace(/[^\d]/g, "")}`} className="text-green-400 hover:underline" target="_blank" rel="noopener noreferrer">{contactPhone}</a>
                            ) : (
                                <span className="text-gray-600">[à compléter]</span>
                            )}
                        </li>
                        <li>
                            📧 Email : {contactEmail ? (
                                <a href={`mailto:${contactEmail}`} className="text-blue-400 hover:underline">{contactEmail}</a>
                            ) : (
                                <span className="text-gray-600">[à compléter]</span>
                            )}
                        </li>
                        <li>🌍 Site officiel : <a href="https://cresapp.site" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">cresapp.site</a></li>
                    </ul>
                </section>
            </div>
        </div>
    );
};

export default TombolaRulesPage; 