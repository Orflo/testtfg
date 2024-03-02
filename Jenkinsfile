pipeline {
    agent any
    stages {
        stage('Build and Deploy') {
            steps {
                script {
                    // Build and deploy using Docker Compose
                    sh 'docker-compose up -d'
                }
            }
        }
    }
}
