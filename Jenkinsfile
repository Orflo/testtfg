pipeline {
    agent any

    tools { nodejs "APP_WOL" }

    stages {
        stage('Build') {
            steps {
                git branch: 'main', url: 'https://github.com/Orflo/testtfg.git'
                sh 'npm install'
                sh 'npm update'
                sh 'npm start'
            }
        }
    }
}
