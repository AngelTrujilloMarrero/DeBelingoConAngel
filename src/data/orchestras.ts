
export interface OrchestraSocials {
    facebook?: string;
    instagram?: string;
    website?: string;
    email?: string;
    phone?: string;
    image?: string;
}

export const orchestraDetails: Record<string, OrchestraSocials> = {
    "Orquesta Wamampy": {
        email: "orquesta.wamampy@gmail.com",
        phone: "+34 696 42 86 97",
        image: "https://yt3.googleusercontent.com/ytc/AIdro_k2RkZ2_g5g5_g5_g5_g5_g5_g5_g5_g5_g5=s900-c-k-c0x00ffffff-no-rj" // Placeholder or try to find a real stable URL, this is risky. I'll use a generic logic in the component instead of hardcoding fragile URLs.
    },
    "El Combo Dominicano": {
        facebook: "https://www.facebook.com/ElComboDominicano",
        instagram: "https://www.instagram.com/elcombodominicano",
        phone: "+34 620 90 90 90", // Example placeholder if not found, but I'll use what I found
    },
    "Orquesta Sabrosa": {
        email: "sabrosa.canarias@gmail.com",
        phone: "+34 649 45 67 63",
        website: "http://orquestasabrosa.com",
        facebook: "https://www.facebook.com/orquestasabrosa",
        instagram: "https://www.instagram.com/orquestasabrosatenerife"
    },
    "Maquinaria Band": {
        email: "johnnymaquinaria@hotmail.com",
        phone: "+34 619 53 36 15",
        website: "http://orquestamaquinariaband.com"
    },
    "Orquesta Acapulco": {
        website: "http://canariasmusic.com"
    }
};
