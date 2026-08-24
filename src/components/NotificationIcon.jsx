import {
	Heart,
	PawPrint,
	ImagePlus,
	FileWarning,
	XCircle,
	CheckCircle,
	Pencil,
	HeartCrack,
} from "lucide-react";

export const NotificationIcon = ({ type }) => {
	if (type === "vote") {
		return (
			<Heart className="w-4 h-4 text-primary-foreground" />
		);
	}

	if (type === "login") {
		return (
			<PawPrint className="w-4 h-4 text-primary-foreground" />
		);
	}

	if (type === "photo") {
		return (
			<ImagePlus className="w-4 h-4 text-primary-foreground" />
		);
	}

	if (type === "edit-success") {
		return (
			<Pencil className="w-4 h-4 text-primary-foreground" />
		);
	}

	if (type === "delete-success") {
		return (
			<HeartCrack className="w-4 h-4 text-primary-foreground" />
		);
	}

	if (type === "success") {
		return (
			<CheckCircle className="w-4 h-4 text-primary-foreground" />
		);
	}

	if (type === "error") {
		return (
			<XCircle className="w-4 h-4 text-primary-foreground" />
		);
	}

	return (
		<FileWarning className="w-4 h-4 text-primary-foreground" />
	);
};
