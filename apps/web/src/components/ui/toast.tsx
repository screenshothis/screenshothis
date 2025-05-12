import { Toaster, type ToasterProps, toast as sonnerToast } from "sonner";

const defaultOptions: ToasterProps = {
	className: "group/toast",
	position: "top-center",
};

const customToast = (
	renderFunc: (t: string | number) => React.ReactElement,
	options: ToasterProps = {},
) => {
	const mergedOptions = { ...defaultOptions, ...options };
	return sonnerToast.custom(renderFunc, mergedOptions);
};

const toast = {
	...sonnerToast,
	custom: customToast,
};

export { Toaster, toast };
