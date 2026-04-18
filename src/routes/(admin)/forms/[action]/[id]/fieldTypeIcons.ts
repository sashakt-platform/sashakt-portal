import UserRound from '@lucide/svelte/icons/user-round';
import Mail from '@lucide/svelte/icons/mail';
import Phone from '@lucide/svelte/icons/phone';
import MapPin from '@lucide/svelte/icons/map-pin';
import Building2 from '@lucide/svelte/icons/building-2';
import Minus from '@lucide/svelte/icons/minus';
import AlignLeft from '@lucide/svelte/icons/align-left';
import Hash from '@lucide/svelte/icons/hash';
import Calendar from '@lucide/svelte/icons/calendar';
import SquareCheck from '@lucide/svelte/icons/square-check';
import CircleDot from '@lucide/svelte/icons/circle-dot';
import ChevronsUpDown from '@lucide/svelte/icons/chevrons-up-down';
import ListChecks from '@lucide/svelte/icons/list-checks';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fieldTypeIcons: Record<string, any> = {
	full_name: UserRound,
	email: Mail,
	phone: Phone,
	state: MapPin,
	district: MapPin,
	block: MapPin,
	entity: Building2,
	text: Minus,
	textarea: AlignLeft,
	number: Hash,
	date: Calendar,
	checkbox: SquareCheck,
	radio: CircleDot,
	select: ChevronsUpDown,
	multi_select: ListChecks
};

export function getFieldTypeIcon(fieldType: string) {
	return fieldTypeIcons[fieldType];
}
