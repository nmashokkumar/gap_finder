/**
 * Preloaded Sample EdTech Dataset: Foundations of AI, Machine Learning & RAG
 * Tailored specifically for {igebra.ai} / AI Ready School curriculum.
 */

export const SAMPLE_SYLLABUS = `
COURSE: Applied AI & Data Science Foundations
TARGET: AI & Machine Learning Specialization

MODULE 1: SUPERVISED LEARNING & MODEL SELECTION
1.1 Regression vs Classification: Problem formulations, linear regression hypothesis, loss functions (MSE), decision boundaries.
1.2 Logistic Regression: Sigmoid activation function, cross-entropy loss, odds ratio, probability thresholds.
1.3 Model Generalization: Bias-variance tradeoff, overfitting vs underfitting, regularization (L1 Lasso, L2 Ridge).

MODULE 2: MODEL EVALUATION & DIAGNOSTIC METRICS
2.1 Confusion Matrix: True Positives (TP), False Positives (FP), True Negatives (TN), False Negatives (FN).
2.2 Precision, Recall & F1-Score: Formula definitions, precision-recall tradeoff, choosing metrics for imbalanced datasets (e.g. medical diagnosis).
2.3 ROC and AUC: Receiver Operating Characteristic curve, False Positive Rate vs True Positive Rate, area under curve interpretation.

MODULE 3: NEURAL NETWORKS & DEEP LEARNING
3.1 Artificial Neurons: Perceptron architecture, weights, bias, activation functions (ReLU, Sigmoid, Softmax).
3.2 Training & Optimization: Forward propagation, loss computation, backpropagation via chain rule, Gradient Descent and learning rate.
3.3 Overfitting in Deep Learning: Dropout regularization, early stopping, batch normalization.

MODULE 4: LLMs & RETRIEVAL-AUGMENTED GENERATION (RAG)
4.1 Embeddings & Vector Space: Semantic representations, tokenization, high-dimensional vector spaces, cosine similarity metric.
4.2 RAG Architecture: Dense vector retrieval, chunking strategies with overlap, top-K context injection into prompts.
4.3 Hallucination Mitigation: Grounding LLM responses in retrieved source context, source citations, verification vs pre-training memory.
`.trim();

export const SAMPLE_NOTES = `
=== CHAPTER 1: SUPERVISED MACHINE LEARNING ===

[Chapter 1: Supervised ML · Section 1.1 · Page 14]
Supervised learning algorithms learn a mapping from input features X to target outputs Y using labeled training data. In Linear Regression, the model predicts continuous target values using the linear hypothesis: y_pred = w^T * x + b. The standard loss function is Mean Squared Error (MSE): MSE = (1/N) * sum((y_actual - y_pred)^2). Linear regression assumes a linear relationship between features and target, and minimizes MSE using Ordinary Least Squares or gradient descent.

[Chapter 1: Supervised ML · Section 1.2 · Page 19]
Logistic Regression is used for binary classification tasks where target variable Y is in {0, 1}. It maps any real-valued number into a probability range [0, 1] using the Sigmoid (logistic) function: sigma(z) = 1 / (1 + exp(-z)), where z = w^T * x + b. Instead of MSE, Logistic Regression is trained using Binary Cross-Entropy Loss (Log Loss) because MSE produces a non-convex loss surface with multiple local minima when combined with the sigmoid function. A default threshold of 0.5 classifies instances as positive or negative.

[Chapter 1: Supervised ML · Section 1.3 · Page 26]
The Bias-Variance Tradeoff is central to model generalization. Bias is the error resulting from overly simplistic assumptions (leading to Underfitting, where the model performs poorly on both training and test sets). Variance is the error resulting from excessive sensitivity to small fluctuations in training data (leading to Overfitting, where training accuracy is high but validation error explodes). Regularization penalizes complex model weights: L1 Regularization (Lasso) adds lambda * sum(|w_i|), driving redundant weights to exact zero for feature selection. L2 Regularization (Ridge) adds lambda * sum(w_i^2), shrinking weights smoothly.

=== CHAPTER 2: MODEL EVALUATION & METRICS ===

[Chapter 2: Evaluation Metrics · Section 2.1 · Page 38]
A Confusion Matrix summarizes prediction performance on classification tasks:
- True Positive (TP): Model correctly predicts positive class.
- False Positive (FP): Model falsely predicts positive (Type I error).
- True Negative (TN): Model correctly predicts negative class.
- False Negative (FN): Model falsely predicts negative (Type II error).
Accuracy = (TP + TN) / (TP + TN + FP + FN). While simple, accuracy is dangerously misleading on imbalanced datasets (e.g., fraud detection where 99% of transactions are legitimate).

[Chapter 2: Evaluation Metrics · Section 2.2 · Page 42]
Precision measures exactness: "Out of all predicted positive cases, what fraction is actually positive?" Formula: Precision = TP / (TP + FP). Recall (Sensitivity) measures completeness: "Out of all actual positive cases, what fraction did the model find?" Formula: Recall = TP / (TP + FN). When False Negatives are costly (such as disease diagnosis), we prioritize Recall. When False Positives are costly (such as spam filtering), we prioritize Precision. The F1-Score is the harmonic mean of Precision and Recall: F1 = 2 * (Precision * Recall) / (Precision + Recall). The harmonic mean is used rather than arithmetic mean because it penalizes extreme imbalances between precision and recall.

[Chapter 2: Evaluation Metrics · Section 2.3 · Page 49]
The Receiver Operating Characteristic (ROC) curve plots True Positive Rate (TPR = Recall) against False Positive Rate (FPR = FP / (FP + TN)) across all classification decision thresholds from 0 to 1. Area Under the ROC Curve (AUC) quantifies overall ranking capability: an AUC of 0.5 indicates random guessing, while AUC of 1.0 represents a perfect classifier. AUC is threshold-independent and invariant to class scale.

=== CHAPTER 3: DEEP LEARNING & NEURAL NETWORKS ===

[Chapter 3: Deep Learning · Section 3.1 · Page 58]
Artificial Neural Networks are composed of layers of interconnected nodes (neurons). Each neuron computes z = sum(w_i * x_i) + b and passes z through a non-linear Activation Function a = f(z). Without non-linear activation functions, stacking multiple layers collapses mathematically into a single linear regression. Modern networks prefer Rectified Linear Unit (ReLU), f(z) = max(0, z), because it solves the vanishing gradient problem encountered in deep sigmoid networks and computes rapidly.

[Chapter 3: Deep Learning · Section 3.2 · Page 65]
Training neural networks involves two phases:
1. Forward Propagation: Input features flow through network layers to calculate predictions and total loss J(w).
2. Backpropagation: The gradient of the loss function with respect to every weight (del J / del w) is calculated moving backward from output to input layers using the mathematical Chain Rule of calculus.
Weights are then updated via Gradient Descent: w = w - alpha * (del J / del w), where alpha is the learning rate. If alpha is too large, the optimization diverges; if too small, training becomes excessively slow.

=== CHAPTER 4: RAG & LARGE LANGUAGE MODELS ===

[Chapter 4: RAG & LLMs · Section 4.1 · Page 78]
Embeddings convert words, sentences, or paragraphs into dense numerical vectors in a continuous geometric space where semantically similar items reside close together. The standard similarity measure is Cosine Similarity: cos(theta) = (A dot B) / (||A|| * ||B||), which evaluates the cosine of the angle between two vectors, ranging from -1 (opposite) to +1 (identical direction), regardless of magnitude.

[Chapter 4: RAG & LLMs · Section 4.2 · Page 86]
Retrieval-Augmented Generation (RAG) is an architectural pattern that connects pre-trained Large Language Models to external private document collections without model retraining. Documents are parsed, broken into semantic chunks (typically 200 to 500 tokens with 10% overlap), and indexed. When a user asks a question, the retriever computes similarity between the query and chunk vectors, fetching the Top-K most relevant passages. These passages are injected into the LLM system prompt as verified context.

[Chapter 4: RAG & LLMs · Section 4.3 · Page 92]
RAG directly mitigates hallucinations by enforcing strict grounding: the generative model is instructed to answer solely based on the retrieved snippets and provide explicit citations (e.g. Chapter 2, Page 42). Fine-tuning modifies internal model weights for style and tone, but cannot guarantee factual accuracy or supply verifiable page references. RAG separates dynamic external knowledge retrieval from language generation.
`.trim();

export const SAMPLE_PAST_PAPERS = `
PAST TECHNICAL ASSESSMENTS & EXAM QUESTIONS (AI & DATA SCIENCE 2023 - 2025)

Question 1 (2024 Exam · 4 Marks):
Explain why Mean Squared Error (MSE) is unsuitable as a loss function for Logistic Regression. What loss function should be used instead and why?

Question 2 (2024 Exam · 5 Marks):
In a medical cancer detection model where failing to detect cancer in a sick patient is catastrophic, should you optimize for Precision or Recall? Define both metrics and explain why.

Question 3 (2023 Exam · 3 Marks):
Explain the Bias-Variance Tradeoff. Describe what happens to training error and validation error when a model is severely overfitting.

Question 4 (2025 Exam · 5 Marks):
State the mathematical formula for the F1-Score. Why do data scientists use the harmonic mean instead of the arithmetic mean when calculating F1-score?

Question 5 (2025 Exam · 4 Marks):
Why are non-linear activation functions necessary in Deep Neural Networks? Explain why ReLU is preferred over Sigmoid in hidden layers.

Question 6 (2024 Exam · 3 Marks):
Explain how backpropagation uses the Chain Rule of calculus to update weights in an Artificial Neural Network.

Question 7 (2025 Exam · 5 Marks):
What is Retrieval-Augmented Generation (RAG)? Distinguish between Retrieval and Generation, and explain why RAG is preferred over fine-tuning for question-answering over private documents.

Question 8 (2023 Exam · 3 Marks):
Define Cosine Similarity. Why is cosine similarity preferred over Euclidean distance when comparing text embeddings?
`.trim();
