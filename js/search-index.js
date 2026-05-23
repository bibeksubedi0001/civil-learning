/* ============================================
   SEARCH INDEX
   Static manifest of all lessons in the site.
   Used by site-search.js for instant client-side search.
   Keep this file in sync with sitemap.xml.
   ============================================ */
window.CE_SEARCH_INDEX = [
    // Chapter 1 — AI vs Machine Learning
    { ch:1, n:0,  href:"chapter1/index.html",  title:"Chapter 1 — AI vs Machine Learning",                   tags:"foundation overview taxonomy" },
    { ch:1, n:1,  href:"chapter1/sub1.html",   title:"1.1 What is Artificial Intelligence?",                 tags:"AI definition turing agent narrow general" },
    { ch:1, n:2,  href:"chapter1/sub2.html",   title:"1.2 History of AI",                                    tags:"history AI winter expert systems perceptron" },
    { ch:1, n:3,  href:"chapter1/sub3.html",   title:"1.3 Traditional Programming vs Machine Learning",      tags:"rules data programming paradigm" },
    { ch:1, n:4,  href:"chapter1/sub4.html",   title:"1.4 Types of Machine Learning",                        tags:"supervised unsupervised reinforcement" },
    { ch:1, n:5,  href:"chapter1/sub5.html",   title:"1.5 Data, Features, and Labels",                       tags:"features labels dataset training" },
    { ch:1, n:6,  href:"chapter1/sub6.html",   title:"1.6 The ML Workflow",                                  tags:"workflow pipeline lifecycle deployment" },
    { ch:1, n:7,  href:"chapter1/sub7.html",   title:"1.7 Bias, Variance & Generalization",                  tags:"overfitting underfitting bias variance" },
    { ch:1, n:8,  href:"chapter1/sub8.html",   title:"1.8 Evaluation Metrics",                               tags:"accuracy precision recall RMSE MAE" },
    { ch:1, n:9,  href:"chapter1/sub9.html",   title:"1.9 Ethics & Responsible AI",                          tags:"ethics fairness bias accountability" },
    { ch:1, n:10, href:"chapter1/sub10.html",  title:"1.10 AI Tools & Frameworks",                           tags:"python tensorflow pytorch scikit" },
    { ch:1, n:11, href:"chapter1/sub11.html",  title:"1.11 Case Studies in CE",                              tags:"case study civil engineering" },
    { ch:1, n:12, href:"chapter1/sub12.html",  title:"1.12 Chapter 1 Summary",                               tags:"summary recap" },

    // Chapter 2 — Supervised Learning
    { ch:2, n:0,  href:"chapter2/index.html",  title:"Chapter 2 — Supervised Learning",                      tags:"supervised prediction regression classification" },
    { ch:2, n:1,  href:"chapter2/sub1.html",   title:"2.1 Introduction to Supervised Learning",              tags:"labeled data predictor" },
    { ch:2, n:2,  href:"chapter2/sub2.html",   title:"2.2 Linear Regression",                                tags:"regression line gradient OLS" },
    { ch:2, n:3,  href:"chapter2/sub3.html",   title:"2.3 Logistic Regression & Classification",             tags:"logistic sigmoid binary classification" },
    { ch:2, n:4,  href:"chapter2/sub4.html",   title:"2.4 Decision Trees",                                   tags:"decision tree split entropy gini" },
    { ch:2, n:5,  href:"chapter2/sub5.html",   title:"2.5 Random Forests & Ensembles",                       tags:"random forest bagging boosting ensemble" },
    { ch:2, n:6,  href:"chapter2/sub6.html",   title:"2.6 Support Vector Machines",                          tags:"SVM kernel margin" },
    { ch:2, n:7,  href:"chapter2/sub7.html",   title:"2.7 k-Nearest Neighbors",                              tags:"KNN distance instance based" },
    { ch:2, n:8,  href:"chapter2/sub8.html",   title:"2.8 Overfitting, Cross-Validation",                    tags:"cross validation k-fold overfitting" },
    { ch:2, n:9,  href:"chapter2/sub9.html",   title:"2.9 Hyperparameter Tuning",                            tags:"grid search bayesian tuning" },
    { ch:2, n:10, href:"chapter2/sub10.html",  title:"2.10 Site Response Case Study",                        tags:"site response geotechnical case study" },

    // Chapter 3 — Unsupervised Learning
    { ch:3, n:0,  href:"chapter3/index.html",  title:"Chapter 3 — Unsupervised Learning",                    tags:"unsupervised clustering pattern" },
    { ch:3, n:1,  href:"chapter3/sub1.html",   title:"3.1 Introduction to Unsupervised Learning",            tags:"unlabeled pattern discovery" },
    { ch:3, n:2,  href:"chapter3/sub2.html",   title:"3.2 K-Means Clustering",                               tags:"k means centroid clustering" },
    { ch:3, n:3,  href:"chapter3/sub3.html",   title:"3.3 Hierarchical Clustering",                          tags:"agglomerative dendrogram linkage" },
    { ch:3, n:4,  href:"chapter3/sub4.html",   title:"3.4 DBSCAN & Density Methods",                         tags:"DBSCAN density noise outlier" },
    { ch:3, n:5,  href:"chapter3/sub5.html",   title:"3.5 PCA & Dimensionality Reduction",                   tags:"PCA principal component variance" },
    { ch:3, n:6,  href:"chapter3/sub6.html",   title:"3.6 t-SNE & UMAP",                                     tags:"t-SNE UMAP manifold embedding" },
    { ch:3, n:7,  href:"chapter3/sub7.html",   title:"3.7 Anomaly Detection",                                tags:"anomaly outlier isolation forest" },
    { ch:3, n:8,  href:"chapter3/sub8.html",   title:"3.8 Association Rules",                                tags:"apriori association market basket" },
    { ch:3, n:9,  href:"chapter3/sub9.html",   title:"3.9 GIS Clustering Case Study",                        tags:"GIS spatial clustering case study" },
    { ch:3, n:10, href:"chapter3/sub10.html",  title:"3.10 Sensor Network Anomalies",                        tags:"sensor anomaly SHM monitoring" },

    // Chapter 4 — CNNs
    { ch:4, n:0,  href:"chapter4/index.html",  title:"Chapter 4 — Convolutional Neural Networks",            tags:"CNN vision perception" },
    { ch:4, n:1,  href:"chapter4/sub1.html",   title:"4.1 From Pixels to Patterns",                          tags:"pixels image patterns" },
    { ch:4, n:2,  href:"chapter4/sub2.html",   title:"4.2 The Convolution Operation",                        tags:"convolution kernel filter" },
    { ch:4, n:3,  href:"chapter4/sub3.html",   title:"4.3 Feature Maps & Filters",                           tags:"feature map filter activation" },
    { ch:4, n:4,  href:"chapter4/sub4.html",   title:"4.4 Pooling Layers",                                   tags:"max pooling avg pooling stride" },
    { ch:4, n:5,  href:"chapter4/sub5.html",   title:"4.5 Building a CNN Architecture",                      tags:"architecture stacking layers" },
    { ch:4, n:6,  href:"chapter4/sub6.html",   title:"4.6 Famous Architectures (VGG, ResNet)",               tags:"VGG ResNet inception" },
    { ch:4, n:7,  href:"chapter4/sub7.html",   title:"4.7 Transfer Learning",                                tags:"transfer learning fine tuning" },
    { ch:4, n:8,  href:"chapter4/sub8.html",   title:"4.8 Object Detection",                                 tags:"YOLO faster RCNN detection" },
    { ch:4, n:9,  href:"chapter4/sub9.html",   title:"4.9 Crack Detection Case Study",                       tags:"crack detection structural inspection" },
    { ch:4, n:10, href:"chapter4/sub10.html",  title:"4.10 Remote Sensing Applications",                     tags:"satellite remote sensing" },

    // Chapter 5 — LLMs
    { ch:5, n:0,  href:"chapter5/index.html",  title:"Chapter 5 — Large Language Models",                    tags:"LLM language transformer" },
    { ch:5, n:1,  href:"chapter5/sub1.html",   title:"5.1 What is a Language Model?",                        tags:"language model probability" },
    { ch:5, n:2,  href:"chapter5/sub2.html",   title:"5.2 Tokenization",                                     tags:"tokenizer BPE wordpiece" },
    { ch:5, n:3,  href:"chapter5/sub3.html",   title:"5.3 Word Embeddings",                                  tags:"embedding word2vec glove" },
    { ch:5, n:4,  href:"chapter5/sub4.html",   title:"5.4 The Attention Mechanism",                          tags:"attention query key value" },
    { ch:5, n:5,  href:"chapter5/sub5.html",   title:"5.5 The Transformer Architecture",                     tags:"transformer self attention" },
    { ch:5, n:6,  href:"chapter5/sub6.html",   title:"5.6 Pre-training & Fine-tuning",                       tags:"pretraining fine tuning" },
    { ch:5, n:7,  href:"chapter5/sub7.html",   title:"5.7 Prompting Strategies",                             tags:"prompt engineering chain of thought" },
    { ch:5, n:8,  href:"chapter5/sub8.html",   title:"5.8 RAG & Retrieval",                                  tags:"RAG retrieval augmentation" },
    { ch:5, n:9,  href:"chapter5/sub9.html",   title:"5.9 Limitations & Hallucinations",                     tags:"hallucination limitation safety" },
    { ch:5, n:10, href:"chapter5/sub10.html",  title:"5.10 LLMs for Engineering Workflows",                  tags:"LLM engineering applications" },

    // Chapter 6 — Neural Networks
    { ch:6, n:0,  href:"chapter6/index.html",  title:"Chapter 6 — Neural Networks: Deep Learning",           tags:"neural networks deep learning MLP" },
    { ch:6, n:1,  href:"chapter6/sub1.html",   title:"6.1 The Perceptron",                                   tags:"perceptron neuron rosenblatt" },
    { ch:6, n:2,  href:"chapter6/sub2.html",   title:"6.2 Multilayer Perceptrons",                           tags:"MLP layers feedforward" },
    { ch:6, n:3,  href:"chapter6/sub3.html",   title:"6.3 Activation Functions",                             tags:"relu sigmoid tanh activation" },
    { ch:6, n:4,  href:"chapter6/sub4.html",   title:"6.4 Loss Functions",                                   tags:"loss MSE cross entropy" },
    { ch:6, n:5,  href:"chapter6/sub5.html",   title:"6.5 Gradient Descent",                                 tags:"gradient descent SGD adam" },
    { ch:6, n:6,  href:"chapter6/sub6.html",   title:"6.6 Backpropagation",                                  tags:"backpropagation chain rule" },
    { ch:6, n:7,  href:"chapter6/sub7.html",   title:"6.7 Regularization",                                   tags:"dropout L1 L2 regularization" },
    { ch:6, n:8,  href:"chapter6/sub8.html",   title:"6.8 Batch Normalization",                              tags:"batch norm normalization" },
    { ch:6, n:9,  href:"chapter6/sub9.html",   title:"6.9 Concrete Strength Prediction",                     tags:"concrete strength regression case study" },
    { ch:6, n:10, href:"chapter6/sub10.html",  title:"6.10 Deploying Neural Networks",                       tags:"deployment ONNX serving" }
];
