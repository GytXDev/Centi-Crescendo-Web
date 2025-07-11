import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import Navigation from '@/components/Navigation';
import { getAllTombolas, getParticipantsByTombola } from '@/lib/supabaseServices';
import { Users, Ticket, Loader2, Download, Award, Percent, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateTicketPDF } from '@/utils/pdfGenerator';
import * as XLSX from 'xlsx';
import { useNavigate } from 'react-router-dom';

function ParticipantsPage() {
    const [tombolas, setTombolas] = useState([]);
    const [selectedTombolaId, setSelectedTombolaId] = useState('');
    const [participants, setParticipants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingTombolas, setLoadingTombolas] = useState(true);
    const navigate = useNavigate();

    // Protection admin
    useEffect(() => {
        if (sessionStorage.getItem('adminAuthenticated') !== 'true') {
            navigate('/admin', { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        async function fetchTombolas() {
            setLoadingTombolas(true);
            const { data, error } = await getAllTombolas();
            if (!error && data) {
                setTombolas(data);
                if (data.length > 0) setSelectedTombolaId(data[0].id);
            }
            setLoadingTombolas(false);
        }
        fetchTombolas();
    }, []);

    useEffect(() => {
        if (!selectedTombolaId) return;
        setLoading(true);
        getParticipantsByTombola(selectedTombolaId).then(({ data, error }) => {
            if (!error && data) setParticipants(data);
            else setParticipants([]);
            setLoading(false);
        });
    }, [selectedTombolaId]);

    // Pagination
    const [page, setPage] = useState(1);
    const pageSize = 100;
    const totalPages = Math.ceil(participants.length / pageSize);
    const paginatedParticipants = participants.slice((page - 1) * pageSize, page * pageSize);

    const handlePrev = () => setPage(p => Math.max(1, p - 1));
    const handleNext = () => setPage(p => Math.min(totalPages, p + 1));
    useEffect(() => { setPage(1); }, [selectedTombolaId, participants.length]);

    // Export Excel
    const exportExcel = () => {
        const rows = participants.map(p => {
            const couponUse = p.coupon_uses?.[0] || {};
            const coupon = couponUse.coupons || {};
            const winner = p.winners?.[0] || {};
            return {
                Nom: p.name,
                Téléphone: p.phone,
                'Airtel Money': p.airtel_money_number,
                Ticket: p.ticket_number,
                'Statut Paiement': p.payment_status,
                'Référence Paiement': p.payment_reference || '-',
                'Date inscription': p.created_at ? new Date(p.created_at).toLocaleString('fr-FR') : '-',
                'Tombola': p.tombolas?.title || '-',
                'Prix Ticket': p.tombolas?.ticket_price || '-',
                'Statut Tombola': p.tombolas?.status || '-',
                'Coupon utilisé': coupon.code || '-',
                'Réduction (%)': coupon.discount_percentage || '-',
                'Créateur coupon': coupon.creator_name || '-',
                'Téléphone créateur': coupon.creator_phone || '-',
                'Prix original': couponUse.original_price || '-',
                'Montant réduction': couponUse.discount_amount || '-',
                'Prix payé': couponUse.final_price || '-',
                'Commission générée': couponUse.commission_earned || '-',
                'Date utilisation coupon': couponUse.used_at ? new Date(couponUse.used_at).toLocaleString('fr-FR') : '-',
                'Gagnant': winner.id ? 'Oui' : 'Non',
                'Rang': winner.prize_rank || '-',
                'Montant gagné': winner.prize_amount || '-',
            };
        });
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Participants');
        XLSX.writeFile(wb, 'participants_tombola.xlsx');
    };

    // Export PDF individuel
    const exportPDF = (p) => {
        const couponUse = p.coupon_uses?.[0] || {};
        const coupon = couponUse.coupons || {};
        const ticketData = {
            name: p.name,
            phone: p.phone,
            ticketNumber: p.ticket_number,
            airtelMoneyNumber: p.airtel_money_number,
            tombolaTitle: p.tombolas?.title || '-',
            originalPrice: p.tombolas?.ticket_price || 0,
            finalPrice: couponUse.final_price || p.tombolas?.ticket_price || 0,
            discountAmount: couponUse.discount_amount || 0,
            drawDate: p.tombolas?.draw_date || '-',
            couponCode: coupon.code || null
        };
        generateTicketPDF(ticketData);
    };

    return (
        <>
            <Helmet>
                <title>Suivi des Participants - Admin | Centi Crescendo</title>
                <meta name="description" content="Liste détaillée des participants par tombola pour l'administration." />
            </Helmet>
            <div className="min-h-screen bg-[#0B0B0F] text-white">
                <Navigation />
                <div className="container mx-auto px-4 py-8">
                    <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
                        <Users className="w-7 h-7 text-blue-400" /> Suivi des Participants
                    </h1>
                    <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center">
                        <label htmlFor="tombola-select" className="font-semibold text-white/80">Sélectionnez une tombola :</label>
                        <select
                            id="tombola-select"
                            className="bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white"
                            value={selectedTombolaId}
                            onChange={e => setSelectedTombolaId(e.target.value)}
                            disabled={loadingTombolas}
                        >
                            {tombolas.map(tombola => (
                                <option key={tombola.id} value={tombola.id}>{tombola.title}</option>
                            ))}
                        </select>
                        <Button onClick={exportExcel} className="bg-green-600 hover:bg-green-700 text-white font-bold flex items-center gap-2 ml-0 sm:ml-4">
                            <FileSpreadsheet className="w-5 h-5" /> Export Excel
                        </Button>
                    </div>

                    {loading ? (
                        <div className="flex items-center gap-2 text-gray-400"><Loader2 className="animate-spin" /> Chargement des participants...</div>
                    ) : participants.length === 0 ? (
                        <div className="text-gray-400">Aucun participant pour cette tombola.</div>
                    ) : (
                        <>
                            <div className="overflow-x-auto rounded-lg border border-gray-800 bg-[#18181C] mb-4">
                                <table className="min-w-[1200px] text-sm text-left">
                                    <thead>
                                        <tr className="bg-gray-900 text-gray-300">
                                            <th className="px-4 py-2">Nom</th>
                                            <th className="px-4 py-2">Téléphone</th>
                                            <th className="px-4 py-2">Airtel Money</th>
                                            <th className="px-4 py-2">Ticket</th>
                                            <th className="px-4 py-2">Statut Paiement</th>
                                            <th className="px-4 py-2">Réf. Paiement</th>
                                            <th className="px-4 py-2">Date inscription</th>
                                            <th className="px-4 py-2">Tombola</th>
                                            <th className="px-4 py-2">Prix Ticket</th>
                                            <th className="px-4 py-2">Statut Tombola</th>
                                            <th className="px-4 py-2">Coupon utilisé</th>
                                            <th className="px-4 py-2">Réduction (%)</th>
                                            <th className="px-4 py-2">Créateur coupon</th>
                                            <th className="px-4 py-2">Tél. créateur</th>
                                            <th className="px-4 py-2">Prix original</th>
                                            <th className="px-4 py-2">Réduction</th>
                                            <th className="px-4 py-2">Prix payé</th>
                                            <th className="px-4 py-2">Commission</th>
                                            <th className="px-4 py-2">Date util. coupon</th>
                                            <th className="px-4 py-2">Gagnant</th>
                                            <th className="px-4 py-2">Rang</th>
                                            <th className="px-4 py-2">Montant gagné</th>
                                            <th className="px-4 py-2">PDF</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedParticipants.map(p => {
                                            const couponUse = p.coupon_uses?.[0] || {};
                                            const coupon = couponUse.coupons || {};
                                            const winner = p.winners?.[0] || {};
                                            return (
                                                <tr key={p.id} className="border-b border-gray-800">
                                                    <td className="px-4 py-2 font-semibold">{p.name}</td>
                                                    <td className="px-4 py-2">{p.phone}</td>
                                                    <td className="px-4 py-2">{p.airtel_money_number}</td>
                                                    <td className="px-4 py-2 font-mono">{p.ticket_number}</td>
                                                    <td className="px-4 py-2">{p.payment_status}</td>
                                                    <td className="px-4 py-2">{p.payment_reference || '-'}</td>
                                                    <td className="px-4 py-2">{p.created_at ? new Date(p.created_at).toLocaleString('fr-FR') : '-'}</td>
                                                    <td className="px-4 py-2">{p.tombolas?.title || '-'}</td>
                                                    <td className="px-4 py-2">{p.tombolas?.ticket_price || '-'}</td>
                                                    <td className="px-4 py-2">{p.tombolas?.status || '-'}</td>
                                                    <td className="px-4 py-2">{coupon.code || '-'}</td>
                                                    <td className="px-4 py-2">{coupon.discount_percentage || '-'}</td>
                                                    <td className="px-4 py-2">{coupon.creator_name || '-'}</td>
                                                    <td className="px-4 py-2">{coupon.creator_phone || '-'}</td>
                                                    <td className="px-4 py-2">{couponUse.original_price || '-'}</td>
                                                    <td className="px-4 py-2">{couponUse.discount_amount || '-'}</td>
                                                    <td className="px-4 py-2">{couponUse.final_price || '-'}</td>
                                                    <td className="px-4 py-2">{couponUse.commission_earned || '-'}</td>
                                                    <td className="px-4 py-2">{couponUse.used_at ? new Date(couponUse.used_at).toLocaleString('fr-FR') : '-'}</td>
                                                    <td className="px-4 py-2">{winner.id ? <Award className="text-yellow-400 inline" title="Gagnant" /> : '-'}</td>
                                                    <td className="px-4 py-2">{winner.prize_rank || '-'}</td>
                                                    <td className="px-4 py-2">{winner.prize_amount || '-'}</td>
                                                    <td className="px-4 py-2">
                                                        <Button size="icon" variant="ghost" title="Exporter PDF" onClick={() => exportPDF(p)}>
                                                            <FileText className="w-5 h-5" />
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <Button onClick={handlePrev} disabled={page === 1} className="bg-gray-700 text-white px-4 py-2 rounded disabled:opacity-50">Précédent</Button>
                                <span className="text-gray-300">Page {page} / {totalPages || 1}</span>
                                <Button onClick={handleNext} disabled={page === totalPages || totalPages === 0} className="bg-gray-700 text-white px-4 py-2 rounded disabled:opacity-50">Suivant</Button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
}

export default ParticipantsPage; 