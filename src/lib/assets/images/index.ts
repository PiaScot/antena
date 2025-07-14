const images: Record<string, string | undefined> = import.meta.glob('./*.jpg', {
	eager: true,
	import: 'default'
});

export function getImagesUrl(name: string) {
	return images[`./${name}`] || '';
}
