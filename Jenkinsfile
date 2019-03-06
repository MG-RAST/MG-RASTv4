pipeline {
    agent { 
        node {label 'bare-metal' }
    } 
    stages {
        stage('Build') { 
            steps {
                sh 'Setup/check-and-load-docker-volume.sh'
                // sh 'CWL/Inputs/DBs/getpredata.sh CWL/Inputs/DBs/' 
                sh 'docker build -t mgrast/ui:testing .' 
            }
        }
        stage('Test') { 
            steps {
                sh 'docker run -t --rm  mgrast/ui:testing ' 
            }
        }
    }
}
