export type TMediaImage = {
	gcs_path: string;
	url?: string | null;
	alt_text?: string | null;
	content_type: string;
	size_bytes: number;
	uploaded_at: string;
};

export type TExternalMedia = {
	type: string;
	provider: string;
	url: string;
	embed_url?: string | null;
	thumbnail_url?: string | null;
};

export type TMedia = {
	image?: TMediaImage | null;
	external_media?: TExternalMedia | null;
};
