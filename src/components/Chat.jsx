import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { chatWithGPT } from "../services/openai";

const Chat = () => {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [waitingForCooldown, setWaitingForCooldown] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message) {
      setError("Please enter a message");
      return;
    }

    setLoading(true);
    setError("");
    setWaitingForCooldown(false);

    try {
      setWaitingForCooldown(true);
      const result = await chatWithGPT(message);
      setResponse(result);
      setMessage(""); // Clear input after successful response
    } catch (err) {
      setError(err.message || "An error occurred while communicating with GPT");
    } finally {
      setLoading(false);
      setWaitingForCooldown(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Chat with GPT</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Message</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            className="w-full h-32"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={loading || !message}
          className="w-full"
        >
          {loading
            ? waitingForCooldown
              ? "Waiting for cooldown..."
              : "Processing..."
            : "Send Message"}
        </Button>

        {response && (
          <div className="mt-4">
            <h2 className="text-lg font-medium mb-2">Response:</h2>
            <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
              {response}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
