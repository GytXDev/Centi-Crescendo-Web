import { supabase } from './customSupabaseClient.js';

/**
 * Upload un fichier vidéo vers Supabase Storage
 */
export async function uploadVideo(file, folder = 'videos') {
    try {
        // Vérifier le type de fichier
        if (!file.type.startsWith('video/')) {
            throw new Error('Le fichier doit être une vidéo');
        }

        // Vérifier la taille du fichier (max 100MB)
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (file.size > maxSize) {
            throw new Error('Le fichier est trop volumineux. Taille maximum : 100MB');
        }

        // Générer un nom de fichier unique
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(2, 15);
        const fileExtension = file.name.split('.').pop();
        const fileName = `${folder}/${timestamp}_${randomString}.${fileExtension}`;

        // Upload du fichier
        const { data, error } = await supabase.storage
            .from('app-files')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            throw error;
        }

        // Obtenir l'URL publique du fichier
        const { data: urlData } = supabase.storage
            .from('app-files')
            .getPublicUrl(fileName);

        return {
            success: true,
            filePath: fileName,
            publicUrl: urlData.publicUrl,
            fileName: file.name,
            fileSize: file.size
        };
    } catch (error) {
        console.error('Erreur lors de l\'upload:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Supprimer un fichier vidéo de Supabase Storage
 */
export async function deleteVideo(filePath) {
    try {
        if (!filePath || typeof filePath !== 'string') {
            console.warn('Chemin de fichier invalide pour la suppression:', filePath);
            return { success: true };
        }

        // Vérifier si le fichier existe avant de tenter la suppression
        const { data: fileExists } = await supabase.storage
            .from('app-files')
            .list(filePath.split('/').slice(0, -1).join('/'), {
                search: filePath.split('/').pop()
            });

        if (!fileExists || fileExists.length === 0) {
            console.warn('Fichier non trouvé pour la suppression:', filePath);
            return { success: true };
        }

        const { error } = await supabase.storage
            .from('app-files')
            .remove([filePath]);

        if (error) {
            console.error('Erreur Supabase lors de la suppression:', error);
            throw error;
        }

        return { success: true };
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        return {
            success: false,
            error: error.message || 'Erreur inconnue lors de la suppression'
        };
    }
}

/**
 * Obtenir l'URL publique d'un fichier
 */
export function getPublicUrl(filePath) {
    if (!filePath) return null;

    const { data } = supabase.storage
        .from('app-files')
        .getPublicUrl(filePath);

    return data.publicUrl;
}

/**
 * Valider un fichier vidéo
 */
export function validateVideoFile(file) {
    const errors = [];

    // Vérifier le type de fichier
    const allowedTypes = [
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/avi',
        'video/mov',
        'video/wmv'
    ];

    if (!allowedTypes.includes(file.type)) {
        errors.push('Format de vidéo non supporté. Formats acceptés : MP4, WebM, OGG, AVI, MOV, WMV');
    }

    // Vérifier la taille (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
        errors.push('Le fichier est trop volumineux. Taille maximum : 100MB');
    }

    // Vérifier le nom de fichier
    if (file.name.length > 100) {
        errors.push('Le nom du fichier est trop long');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
} 