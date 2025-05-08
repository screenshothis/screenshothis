import Loading02Icon from "virtual:icons/hugeicons/loading-02";

export default function Loader() {
	return (
		<div className="flex h-full items-center justify-center pt-8">
			<Loading02Icon className="animate-spin text-(--text-sub-600)" />
		</div>
	);
}
