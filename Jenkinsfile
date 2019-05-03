pipeline {
    agent { 
        node {label 'bare-metal' }
    } 
    stages {
        stage('Build') { 
            steps {
                sh 'docker build -t mgrast/ui:testing .' 
            }
        }
        stage('Test') { 
            steps {
                sh 'docker run -t --rm  mgrast/ui:testing echo success' 
            }
        }
    }
}
