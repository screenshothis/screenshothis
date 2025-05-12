import Alert01SolidIcon from "virtual:icons/hugeicons/alert-01-solid";
import CancelCircleSolidIcon from "virtual:icons/hugeicons/cancel-circle-solid";
import CheckmarkCircle02SolidIcon from "virtual:icons/hugeicons/checkmark-circle-02-solid";
import InformationCircleSolidIcon from "virtual:icons/hugeicons/information-circle-solid";
import MagicWand01SolidIcon from "virtual:icons/hugeicons/magic-wand-01-solid";

import * as React from "react";

import * as Alert from "./alert.tsx";
import { toast } from "./toast.tsx";

type AlertToastProps = {
	t: string | number;
	$status?: React.ComponentPropsWithoutRef<typeof Alert.Root>["$status"];
	$variant?: React.ComponentPropsWithoutRef<typeof Alert.Root>["$variant"];
	message: string;
	action?: React.ReactNode;
	dismissable?: boolean;
	icon?: React.ElementType;
};

const AlertToast = React.forwardRef<
	React.ComponentRef<typeof Alert.Root>,
	AlertToastProps
>(
	(
		{
			t,
			$status = "feature",
			$variant = "stroke",
			message,
			action,
			dismissable = true,
			icon,
		},
		forwardedRef,
	) => {
		let Icon: React.ElementType;

		if (icon) {
			Icon = icon;
		} else {
			switch ($status) {
				case "success":
					Icon = CheckmarkCircle02SolidIcon;
					break;
				case "warning":
					Icon = Alert01SolidIcon;
					break;
				case "error":
					Icon = CancelCircleSolidIcon;
					break;
				case "information":
					Icon = InformationCircleSolidIcon;
					break;
				case "feature":
					Icon = MagicWand01SolidIcon;
					break;
				default:
					Icon = CancelCircleSolidIcon;
					break;
			}
		}

		return (
			<Alert.Root
				ref={forwardedRef}
				$status={$status}
				$variant={$variant}
				$size="sm"
				className="w-[360px]"
			>
				<Alert.Icon as={Icon} />
				{message}
				{action}
				{dismissable && (
					<button type="button" onClick={() => toast.dismiss(t)}>
						<Alert.CloseIcon className="size-4" />
					</button>
				)}
			</Alert.Root>
		);
	},
);
AlertToast.displayName = "AlertToast";

export { AlertToast as Root };
