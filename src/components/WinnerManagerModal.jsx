import React, { useEffect, useState } from 'react';
import { X, Upload } from 'lucide-react';
import { getWinnersByTombola, updateWinnerPhotoUrl } from '@/lib/supabaseServices';
import { uploadWinnerPhoto } from '@/lib/fileUploadService';

function WinnerManagerModal({ isOpen, onClose, tombola }) {
    const [winners, setWinners] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadingId, setUploadingId] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const fetchWinners = async () => {
        setLoading(true);
        const { data } = await getWinnersByTombola(tombola.id);
        setWinners(data || []);
        setLoading(false);
    };

    useEffect(() => {
        if (isOpen && tombola) {
            fetchWinners();
            setErrorMsg('');
            setSuccessMsg('');
        }
        // eslint-disable-next-line
    }, [isOpen, tombola]);

    const handlePhotoChange = async (e, winnerId) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploadingId(winnerId);
        setErrorMsg('');
        setSuccessMsg('');
        // Upload
        const uploadRes = await uploadWinnerPhoto(file);
        if (!uploadRes.success) {
            setErrorMsg(uploadRes.error || "Erreur lors de l'upload de la photo.");
            setUploadingId(null);
            return;
        }
        // Update DB
        const { error } = await updateWinnerPhotoUrl(winnerId, uploadRes.publicUrl);
        if (error) {
            setErrorMsg("Erreur lors de la mise à jour de la photo du gagnant.");
            setUploadingId(null);
            return;
        }
        setSuccessMsg('Photo mise à jour !');
        await fetchWinners();
        setUploadingId(null);
    };

    if (!isOpen || !tombola) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-[#1C1C21] rounded-2xl p-8 w-full max-w-lg relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white"
                >
                    <X className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-white mb-6 text-center">
                    Gérer les gagnants de "{tombola.title}"
                </h2>
                {errorMsg && <div className="text-red-400 text-center mb-2">{errorMsg}</div>}
                {successMsg && <div className="text-green-400 text-center mb-2">{successMsg}</div>}
                {loading ? (
                    <div className="text-center text-gray-400">Chargement des gagnants...</div>
                ) : winners.length === 0 ? (
                    <div className="text-center text-gray-400">Aucun gagnant pour cette tombola.</div>
                ) : (
                    <div className="space-y-6 max-h-96 overflow-y-auto">
                        {winners.map((winner) => (
                            <div key={winner.id} className="flex items-center gap-4 bg-[#23232A] rounded-xl p-4">
                                <img
                                    src={winner.photo_url || 'https://images.unsplash.com/photo-1673381572188-9c26638c73fd'}
                                    alt={winner.participants?.name || 'Gagnant'}
                                    className="w-14 h-14 rounded-full object-cover border-2 border-gray-700"
                                />
                                <div className="flex-1">
                                    <div className="font-bold text-white text-lg">{winner.participants?.name || 'Anonyme'}</div>
                                    <div className="text-gray-400 text-sm">Ticket: {winner.participants?.ticket_number || 'N/A'}</div>
                                    <div className="text-green-400 text-sm font-medium">{winner.prize_amount} CFA</div>
                                </div>
                                <label className="flex flex-col items-center cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={e => handlePhotoChange(e, winner.id)}
                                        disabled={uploadingId === winner.id}
                                    />
                                    <span className={`flex items-center gap-1 ${uploadingId === winner.id ? 'text-gray-400' : 'text-yellow-400 hover:text-yellow-300'}`}>
                                        <Upload className="w-5 h-5" />
                                        {uploadingId === winner.id ? 'Envoi...' : 'Photo'}
                                    </span>
                                </label>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default WinnerManagerModal; 