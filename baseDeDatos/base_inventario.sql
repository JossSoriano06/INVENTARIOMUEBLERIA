create database muebles;
use muebles;
create table clientes (
	id_clientes int primary key auto_increment,
    nombre_cliente varchar(100) not null,
    apellido_cliente varchar(100) not null
    );
    
create table productos (
	id_producto int primary key auto_increment,
    nombre_producto varchar(100) not null,
    descripcion_producto varchar (100) not null,
	precio_producto decimal(10, 2) not null
);

create table ventas (
	id_venta int primary key auto_increment,
    fecha_vente date not null,
    total_venta decimal(10,2) not null,
    id_cliente int,
    foreign key (id_cliente) references clientes(id_clientes)
);



create table colores (
colore varchar(100)
);
TRUNCATE TABLE colores;

INSERT INTO colores (color) VALUES
('Iviza'),
('Rojo'),
('Azul'),
('Verde'),
('Amarillo');

INSERT INTO colores (color) VALUES
('Iviza'),
('Chantilly'),
('Humo'),
('Wenge'),
('Cedro'),
('Lila'),
('Rosado'),
('Arena'),
('Light Sonoma'),
('Caramelo'),
('Blanco'),
('Cedro');
select * from colores;


create table detalle_ventas (
	id_detalle_venta int primary key auto_increment,
    id_venta int,
    id_producto int,
    cantidad_detalle_ventas_productos int not null,
    precio_detalle_ventas_productos decimal(10,2) not null,
    sub_total_detalle_ventas decimal (10,2) not null,
    foreign key (id_venta) references ventas (id_venta),
    foreign key (id_producto) references productos (id_producto)
);
ALTER TABLE colores CHANGE colore color VARCHAR(100);
use muebles;
select * from detalle_ventas;
 ALTER TABLE detalle_ventas DROP COLUMN colores;
 ALTER TABLE detalle_ventas
ADD COLUMN color VARCHAR(100) NOT NULL
AFTER id_producto;


CREATE TABLE boleta_serie (
    id INT AUTO_INCREMENT PRIMARY KEY,
    serie VARCHAR(4) NOT NULL,
    correlativo INT NOT NULL
);

INSERT INTO boleta_serie (serie, correlativo)
VALUES ('B001', 0);
