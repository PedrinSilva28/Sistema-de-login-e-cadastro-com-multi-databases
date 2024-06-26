// ----------------------------------- CONFIGURAÇÃO BÁSICA ----------------------------------- //

const bodyParser = require('body-parser');
const express = require('express');
const app = express();
const mysql = require('mysql2');
const path = require('path');
const session = require('express-session');
const port = 8080;

const http = require('http');

const server = http.createServer(app); // Usando o servidor Express como argumento
const io = socketIo(server);


/* ---------------- SESSION ------------------- */

app.use(session({
    secret: 'Keyboard cat', // Segredo para assinar o cookie da sessão, pode ser uma string ou um array de strings
    resave: false, // Evita a regravação da sessão no servidor mesmo que ela não tenha sido modificada
    saveUninitialized: true, // Força uma sessão "não inicializada" a ser salva no armazenamento
}));

/* -------------- DEMAIS CONFIGURAÇÕES ------------------- */

//parte onde definimos a usuabilidade do ejs, path e express 

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use('/public', express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, '/views'));


/* ----------------------------------- CONEXÃO COM O BANCO DE DADOS ----------------------------------- */

//conecção inicial com banco de dados, onde posteriormente é feito a validação do usuario 

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '@Darque28',
    database: 'users'
})

connection.connect((err)=>{
    if(err){
        console.log('Erro ao conectar ao banco de dados.');
        return;
        
    }
})


// ---------------------------- INICIALIZAÇÃO DO SERVER  ---------------------------- //

//para abir o servidor

server.listen(port, () => {
    console.log(`Servidor rodando em localhost:${port}`);
});


// -------------------------------------------------------- NAVEGAÇÃO -------------------------------------------------------- //


//---------- LOGIN ----------//

app.post('/',(req,res)=>{
    const email = req.body.email;
    const senha = req.body.senha;
    const sql = `SELECT * FROM usuarios WHERE email = '${email}' AND senha = '${senha}'`
    
    if(email & senha){
        connection.query(sql,(err, result)=>{
            if(result.length === 1 ){
    
                req.session.bancoDeDados = {
                    host: 'localhost',
                    user: 'root',
                    password: '@Darque28',
                    database: `user_${result[0].id}`
                };
    
                req.session.login = result[0];

                res.redirect('/home');
            }else{
                res.redirect('/');
            }
        })
    }else{
        res.redirect('/');
    }
})


app.get('/', (req,res)=>{
    if(req.session.login){
        res.redirect('/home');
    }else{
        res.render('auth/login');
    }
});



//---------- CADASTRO ----------//

app.get('/cadastro', (req,res)=>{
    res.render('auth/cadastro')
});

app.post('/cadastro',(req,res)=>{
    const usuario = req.body.usuario;
    const email = req.body.email;
    const senha = req.body.senha;

    if(usuario & email & senha){

        connection.query(`INSERT INTO usuarios(nome,email,senha) VALUES ('${usuario}','${email}','${senha}')`,(err,result)=>{

            const sql = `SELECT * FROM usuarios WHERE email = '${email}' AND senha = '${senha}'`;
     
            connection.query(sql,(err,result)=>{
             
                if(result.length === 1 ){
     
                    req.session.bancoDeDados = {
                        host: 'localhost',
                        user: 'root',
                        password: '@Darque28',
                        database: `user_${result[0].id}`
                    };
     
                    let bdd = mysql.createConnection(req.session.bancoDeDados);
     
                    bdd.connect((err)=>{
                        if (err) {
                            res.status(500).send('Erro interno 2.');
                            return;
                        }
                    })
     
                    connection.query(`CREATE DATABASE user_${result[0].id}`,(err,result)=>{})
     
                    req.session.login = result[0];
     
                    res.redirect('/home');
                     
                }else{
                    res.redirect('/cadastro');
                }
            })
         })
    }else{
        res.redirect('/cadastro');
    } 
})


//---------- HOME ----------//

app.get('/home', (req,res)=>{

    if(req.session.login && req.session.bancoDeDados){

        res.render('navegacao/home/index', { nomeUsuario: req.session.login.nome });

    }else{

        res.redirect('/');

    }
});


//---------- SAIR ----------//

app.get('/sair',(req,res)=>{

    req.session.bancoDeDados = null;
    req.session.login = null;
    res.redirect('/');
    
});
