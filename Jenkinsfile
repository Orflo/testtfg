pipeline {
    agent any
    tools {
        nodejs "APP_WOL" 
    }
    stages {

        stage('Build') {
            steps {
                git branch: 'main', url: 'https://github.com/Orflo/testtfg.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'pwd'
                sh 'ls -la'
                sh 'npm install'
                sh 'npm update'
            }
        }

//        stage('Install pm2') {
//            steps {
//                sh 'npm install pm2@latest -g'
//            }
//        }

        stage('Deploy') {
            steps {
                sh 'pm2 startOrRestart pm2.config.json'
                sh 'pm2 save'
            }        
        }  
    }
}
