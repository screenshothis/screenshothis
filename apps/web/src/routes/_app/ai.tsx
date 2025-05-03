import { useChat } from "@ai-sdk/react";
import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";
import * as React from "react";

import { Button } from "#/components/ui/button.tsx";
import { Input } from "#/components/ui/input.tsx";

export const Route = createFileRoute("/_app/ai")({
	component: RouteComponent,
});

function RouteComponent() {
	const { messages, input, handleInputChange, handleSubmit } = useChat({
		api: `${import.meta.env.VITE_SERVER_URL}/ai`,
	});

	const messagesEndRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	return (
		<div className="mx-auto grid w-full grid-rows-[1fr_auto] overflow-hidden p-4">
			<div className="space-y-4 overflow-y-auto pb-4">
				{messages.length === 0 ? (
					<div className="mt-8 text-center text-muted-foreground">
						Ask me anything to get started!
					</div>
				) : (
					messages.map((message) => (
						<div
							key={message.id}
							className={`rounded-lg p-3 ${
								message.role === "user"
									? "ml-8 bg-primary/10"
									: "mr-8 bg-secondary/20"
							}`}
						>
							<p className="mb-1 font-semibold text-sm">
								{message.role === "user" ? "You" : "AI Assistant"}
							</p>
							<div className="whitespace-pre-wrap">{message.content}</div>
						</div>
					))
				)}
				<div ref={messagesEndRef} />
			</div>

			<form
				onSubmit={handleSubmit}
				className="flex w-full items-center space-x-2 border-t pt-2"
			>
				<Input
					name="prompt"
					value={input}
					onChange={handleInputChange}
					placeholder="Type your message..."
					className="flex-1"
					autoComplete="off"
					autoFocus
				/>
				<Button type="submit" size="icon">
					<Send size={18} />
				</Button>
			</form>
		</div>
	);
}
