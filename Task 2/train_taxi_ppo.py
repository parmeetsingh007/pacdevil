import gymnasium as gym
import numpy as np
from stable_baselines3 import PPO
from stable_baselines3.common.monitor import Monitor
from stable_baselines3.common.vec_env import DummyVecEnv

STANDARD_LR = 0.0003
AGGRESSIVE_LR = 0.001
TOTAL_TIMESTEPS = 500_000


def make_train_env():
    def _make():
        env = gym.make("Taxi-v3")
        return Monitor(env)
    return _make


def train_and_test(learning_rate, run_name):
    print("\n" + "=" * 80)
    print(f"Training PPO on Taxi-v3 | lr={learning_rate} {run_name}")
    print("=" * 80)

    env = DummyVecEnv([make_train_env()])

    model = PPO(
        "MlpPolicy",
        env,
        learning_rate=learning_rate,
        gamma=0.99,
        gae_lambda=0.95,
        n_steps=2048,
        batch_size=64,
        ent_coef=0.01,
        verbose=1,
    )

    model.learn(total_timesteps=TOTAL_TIMESTEPS)
    model.save(f"ppo_taxi_lr_{str(learning_rate).replace('.', '_')}")

    print("\nTesting the trained agent...")
    test_env = gym.make("Taxi-v3")
    num_episodes = 10

    for ep in range(num_episodes):
        obs, info = test_env.reset()
        total_reward = 0
        done = False

        while not done:
            action, _ = model.predict(obs, deterministic=True)
            action = int(np.array(action).item())
            obs, reward, terminated, truncated, info = test_env.step(action)
            total_reward += reward
            done = terminated or truncated

        print(f"Episode {ep + 1}: Total Reward = {total_reward}")

    test_env.close()


if __name__ == "__main__":
    train_and_test(STANDARD_LR, "(standard LR)")
    train_and_test(AGGRESSIVE_LR, "(aggressive LR)")
