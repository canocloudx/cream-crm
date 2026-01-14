// Inline 3D Login Page HTML - Self-contained for production compatibility
module.exports = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - C.R.E.A.M. COFFEE CRM</title>
    <meta name="description" content="C.R.E.A.M. COFFEE CRM - Staff Login">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet">
    <link rel="stylesheet" href="/styles.css">
    <script type="importmap">{"imports":{"three":"https://unpkg.com/three@0.160.0/build/three.module.js"}}</script>
    <style>
        body,html{margin:0;padding:0;overflow:hidden;width:100%;height:100%}
        #canvas-container{position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;background:#050510}
        .login-container{position:absolute;top:0;left:0;width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;z-index:1;pointer-events:none}
        .login-card{pointer-events:auto;background:rgba(15,15,25,0.4);border:1px solid rgba(0,255,255,0.3);border-radius:16px;padding:48px 40px;width:100%;max-width:420px;backdrop-filter:blur(8px);box-shadow:0 0 40px rgba(0,255,255,0.1),0 0 80px rgba(255,0,255,0.05);position:relative;overflow:hidden;margin:auto}
        .login-form .form-input{background:rgba(10,10,15,0.6)}
        .login-logo img{height:60px;width:auto;max-width:100%;object-fit:contain;margin-bottom:12px;display:block;margin-left:auto;margin-right:auto}
        .login-btn{background:linear-gradient(135deg,#00ffff 0%,#00cccc 100%);color:#000;font-weight:700;border:none;box-shadow:0 0 15px rgba(0,255,255,0.4);transition:all 0.3s ease}
        .login-btn:hover{background:linear-gradient(135deg,#ccffff 0%,#00ffff 100%);box-shadow:0 0 25px rgba(0,255,255,0.6);transform:translateY(-2px)}
    </style>
</head>
<body>
    <div id="canvas-container"></div>
    <div class="login-container">
        <div class="login-card">
            <div class="login-logo">
                <img src="/logo-icon.png" alt="C.R.E.A.M. Coffee">
                <h1>C.R.E.A.M. COFFEE</h1>
                <p>Staff Portal</p>
            </div>
            <form class="login-form" id="loginForm">
                <div class="login-error" id="loginError">
                    <span class="material-icons-round">error</span>
                    <span id="loginErrorText">Invalid email or password</span>
                </div>
                <div class="form-group">
                    <label for="email"><span class="material-icons-round">email</span>Email Address</label>
                    <input type="email" class="form-input" id="email" placeholder="Enter your email" required autocomplete="email">
                </div>
                <div class="form-group">
                    <label for="password"><span class="material-icons-round">lock</span>Password</label>
                    <div class="password-wrapper">
                        <input type="password" class="form-input" id="password" placeholder="Enter your password" required autocomplete="current-password">
                        <button type="button" class="password-toggle" onclick="togglePassword()"><span class="material-icons-round">visibility_off</span></button>
                    </div>
                </div>
                <button type="submit" class="login-btn" id="loginBtn"><span class="material-icons-round">login</span>Sign In</button>
            </form>
            <div class="login-footer"><p>First time? <a href="#" onclick="openSetPasswordModal();return false;">Set your password</a></p></div>
        </div>
    </div>
    <script>
        document.addEventListener('DOMContentLoaded',()=>{const session=localStorage.getItem('staffSession');if(session){try{const user=JSON.parse(session);if(user&&user.id){window.location.href='/index.html#transactions'}}catch(e){localStorage.removeItem('staffSession')}}});
        function togglePassword(){const input=document.getElementById('password');const icon=document.querySelector('.password-toggle .material-icons-round');if(input.type==='password'){input.type='text';icon.textContent='visibility'}else{input.type='password';icon.textContent='visibility_off'}}
        document.getElementById('loginForm').addEventListener('submit',async(e)=>{e.preventDefault();const email=document.getElementById('email').value.trim();const password=document.getElementById('password').value;const btn=document.getElementById('loginBtn');const errorDiv=document.getElementById('loginError');const errorText=document.getElementById('loginErrorText');errorDiv.classList.remove('show');btn.disabled=true;btn.innerHTML='<span class="material-icons-round rotating">sync</span>Signing in...';try{const response=await fetch('/api/staff/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});const data=await response.json();if(data.success&&data.user){localStorage.setItem('staffSession',JSON.stringify(data.user));window.location.href='/index.html#transactions'}else{throw new Error(data.error||'Invalid credentials')}}catch(error){errorText.textContent=error.message||'Login failed. Please try again.';errorDiv.classList.add('show');btn.disabled=false;btn.innerHTML='<span class="material-icons-round">login</span>Sign In'}});
        function openSetPasswordModal(){alert("Please use the standard login page for password reset.")}
    </script>
    <script type="module">
        import*as THREE from'three';
        const container=document.getElementById('canvas-container');
        const scene=new THREE.Scene();scene.background=new THREE.Color(0x050510);scene.fog=new THREE.Fog(0x050510,10,50);
        const camera=new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);camera.position.z=5;
        const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(window.innerWidth,window.innerHeight);renderer.setPixelRatio(window.devicePixelRatio);container.appendChild(renderer.domElement);
        const gridHelper=new THREE.GridHelper(50,50,0x00ffff,0xff00ff);scene.add(gridHelper);
        const geometry=new THREE.BufferGeometry();const particlesCount=700;const posArray=new Float32Array(particlesCount*3);for(let i=0;i<particlesCount*3;i++){posArray[i]=(Math.random()-0.5)*15}geometry.setAttribute('position',new THREE.BufferAttribute(posArray,3));
        const material=new THREE.PointsMaterial({size:0.02,color:0x00ffff,transparent:true,opacity:0.8});const particlesMesh=new THREE.Points(geometry,material);scene.add(particlesMesh);
        const torusGeometry=new THREE.TorusGeometry(3,0.02,16,100);const torusMaterial=new THREE.MeshBasicMaterial({color:0xff00ff,wireframe:true});const torus=new THREE.Mesh(torusGeometry,torusMaterial);scene.add(torus);
        const torus2Geometry=new THREE.TorusGeometry(2,0.02,16,100);const torus2Material=new THREE.MeshBasicMaterial({color:0x00ffff,wireframe:true});const torus2=new THREE.Mesh(torus2Geometry,torus2Material);scene.add(torus2);
        function createCoffeeBean(color,x,y,z,scale){const beanGeometry=new THREE.SphereGeometry(1,16,16);beanGeometry.scale(0.6,1,0.8);const beanMaterial=new THREE.MeshBasicMaterial({color:color,wireframe:true,transparent:true,opacity:0.6});const bean=new THREE.Mesh(beanGeometry,beanMaterial);bean.position.set(x,y,z);bean.scale.set(scale,scale,scale);return bean}
        const beans=[];for(let i=0;i<5;i++){const bean=createCoffeeBean(0xff00ff,(Math.random()-0.5)*10,(Math.random()-0.5)*5,(Math.random()-0.5)*5,0.3+Math.random()*0.2);bean.userData={rotSpeedX:(Math.random()-0.5)*0.02,rotSpeedY:(Math.random()-0.5)*0.02};scene.add(bean);beans.push(bean)}
        const cups=[];const cupGeometry=new THREE.CylinderGeometry(0.5,0.3,0.8,16);const cupMaterial=new THREE.MeshBasicMaterial({color:0x00ffff,wireframe:true,transparent:true,opacity:0.5});for(let i=0;i<3;i++){const cup=new THREE.Mesh(cupGeometry,cupMaterial);cup.position.set((Math.random()-0.5)*12,(Math.random()-0.5)*6,(Math.random()-0.5)*6);cup.scale.set(0.5,0.5,0.5);cup.userData={rotSpeedX:(Math.random()-0.5)*0.01,rotSpeedY:(Math.random()-0.5)*0.01};scene.add(cup);cups.push(cup)}
        let mouseX=0;let mouseY=0;document.addEventListener('mousemove',(event)=>{mouseX=(event.clientX/window.innerWidth)*2-1;mouseY=-(event.clientY/window.innerHeight)*2+1});
        const clock=new THREE.Clock();
        function animate(){const elapsedTime=clock.getElapsedTime();particlesMesh.rotation.y=elapsedTime*0.05;particlesMesh.rotation.x=-mouseY*0.1;particlesMesh.rotation.y+=mouseX*0.1;torus.rotation.x=elapsedTime*0.2;torus.rotation.y=elapsedTime*0.1;torus2.rotation.x=-elapsedTime*0.2;torus2.rotation.z=elapsedTime*0.1;beans.forEach(bean=>{bean.rotation.x+=bean.userData.rotSpeedX;bean.rotation.y+=bean.userData.rotSpeedY;bean.position.y+=Math.sin(elapsedTime+bean.position.x)*0.002});cups.forEach(cup=>{cup.rotation.x+=cup.userData.rotSpeedX;cup.rotation.y+=cup.userData.rotSpeedY;cup.position.y+=Math.cos(elapsedTime+cup.position.x)*0.002});camera.position.x+=(mouseX*0.5-camera.position.x)*0.05;camera.position.y+=(mouseY*0.5-camera.position.y)*0.05;camera.lookAt(scene.position);renderer.render(scene,camera);requestAnimationFrame(animate)}
        animate();
        window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight)});
    </script>
</body>
</html>`;
