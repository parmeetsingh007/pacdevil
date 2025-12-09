PPO Taxi-v3 Reinforcement Learning – Task 2:

This project trains a reinforcement learning agent to solve the Taxi-v3 environment from Gymnasium using the PPO (Proximal Policy Optimization) algorithm.
The goal of the agent is to pick up a passenger and drop them at the correct location while minimizing penalties.

During the learning phase, the model was trained twice, each time with a different learning rate to observe how the choice of learning rate affects performance.

Why PPO instead of DQN?

Although Taxi-v3 can be solved using DQN, PPO was chosen because:

| PPO | DQN |
|-----|-----|
| Uses a policy-gradient method | Uses Q-learning |
| Handles continuous & discrete action spaces | Works mainly with discrete actions |
| Trains using batches from multiple trajectories (more stable) | Sensitive to replay buffer + hyperparameters |
| Clip-based loss prevents large policy updates (stays stable during training) | Q-values can diverge causing instability |


In simpler terms:
PPO is more stable while learning because it prevents sudden big jumps in the policy.
Since the objective of the task was to understand reinforcement-learning behavior rather than fully solve the environment, PPO was a good fit.

Experiment Setup:

Two models were trained with the same PPO setup but different learning rates.

Run	Learning Rate	Purpose
Standard Run	0.0003	Slow and stable learning
Aggressive Run	0.001	Faster learning but risk of instability

Both models were trained for 500,000 timesteps, and then tested for 10 episodes each.
The total reward per episode was printed to evaluate performance.

Results Summary:
Run	Mean Reward	Notes
Standard LR (0.0003)	−200	Training was stable, but the agent did not learn the task
Aggressive LR (0.001)	Mixed (some positive episodes)	Learned in a few test episodes but unstable overall

Interpretation:

The results showed that
A lower learning rate keeps the model stable but may learn too slowly to solve the task within the given training time.
A higher learning rate enables the model to make progress faster, but it can also lead to unstable learning and inconsistent results.
