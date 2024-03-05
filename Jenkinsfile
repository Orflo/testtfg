pipeline {
    agent any

    tools {nodejs "node"}

    stages('Build') {
        steps {
            git 'https://github.com/Orflo/testtfg.git'
            sh 'npm install'
            sh 'npm update'
            sh 'npm start'
        } 
    }
}