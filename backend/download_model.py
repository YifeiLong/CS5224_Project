"""
download_model.py

Download a small local L1M for the advisory module and save it under ./models/.

Why this file exists:
- We do not want to call a paid hosted API for every request.
- We want a simple "prepare once, run later" workflow on the cloud VM.
- This script downloads the tokenizer and model weights ahead of time.

Default choice:
- DeepSeek-R1-Distill-Qwen-1.5B
This is a small official DeepSeek distilled model and is a reasonable MVP choice
for our course project.

How to use:
1) Install dependencies:
   pip install torch transformers accelerate huggingface_hub

2) Run:
   python download_model.py

3) Optional: choose a different save path or model name
   python download_model.py --model-name deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B --save-dir ./models/deepseek-r1-1_5b

Notes:
- First download may take a while because model files are large.
- On the server, it is usually better to download once, then load from local path later.
- This script only downloads files. It does not start the API service.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from transformers import AutoModelForCausalLM, AutoTokenizer


DEFAULT_MODEL_NAME = "deepseek-ai/DeepSeek-R1-Distill-Qwen-1.5B"
DEFAULT_SAVE_DIR = "./models/deepseek-r1-distill-qwen-1.5b"


def parse_args() -> argparse.Namespace:
    """Read command-line arguments."""
    parser = argparse.ArgumentParser(
        description="Download a local LLM model and tokenizer for the advisory service."
    )
    parser.add_argument(
        "--model-name",
        type=str,
        default=DEFAULT_MODEL_NAME,
        help="Hugging Face model name to download.",
    )
    parser.add_argument(
        "--save-dir",
        type=str,
        default=DEFAULT_SAVE_DIR,
        help="Local folder used to store the tokenizer and model.",
    )
    return parser.parse_args()


def ensure_dir(path: Path) -> None:
    """Create the target folder if it does not exist."""
    path.mkdir(parents=True, exist_ok=True)


def download_tokenizer(model_name: str, save_dir: Path) -> None:
    """
    Download the tokenizer files and save them locally.

    We keep this step separate from the model download so the progress is easier
    to understand if anything fails on the server.
    """
    print(f"[1/2] Downloading tokenizer for: {model_name}")
    tokenizer = AutoTokenizer.from_pretrained(
        model_name,
        trust_remote_code=True,
    )
    tokenizer.save_pretrained(save_dir)
    print(f"Tokenizer saved to: {save_dir}")


def download_model(model_name: str, save_dir: Path) -> None:
    """
    Download the model weights and config, then save them locally.

    We use device_map='cpu' here because this script is only for downloading.
    Actual loading strategy for inference can be handled separately in llm_service.py.
    """
    print(f"[2/2] Downloading model weights for: {model_name}")
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        trust_remote_code=True,
        device_map="cpu",
    )
    model.save_pretrained(save_dir)
    print(f"Model saved to: {save_dir}")


def main() -> None:
    args = parse_args()
    save_dir = Path(args.save_dir)

    print("Preparing local model directory...")
    ensure_dir(save_dir)

    print(f"Target model     : {args.model_name}")
    print(f"Local save folder: {save_dir.resolve()}")

    download_tokenizer(args.model_name, save_dir)
    download_model(args.model_name, save_dir)

    print("\nDone.")
    print("You can now load the model from this local folder in llm_service.py.")


if __name__ == "__main__":
    main()
